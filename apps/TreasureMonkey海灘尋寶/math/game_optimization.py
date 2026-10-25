"""Deterministic positive-weight calibration of evaluated books; no payout edits.

Uses the local template's smooth log-payout tilt and separate base trigger
strata. A final integer Diophantine correction makes published RTP exactly 0.96.
"""
import math
from collections import defaultdict
import numpy as np

CAP = 2_000_000
TOTAL_WEIGHT = 10**15
CAP_MASS = {'base':1e-7, 'bonus':1e-6, 'bonus_hits':1e-5, 'bonus_epic':2e-5}

def profile(payouts, target, mass=1.0, fixed_lambda=None):
    p = np.asarray(payouts,dtype=float)
    x = np.log1p(p/max(1,target))
    def at(lam):
        logs=lam*x;w=np.exp(logs-logs.max());w/=w.sum()
        return float(w@p),w
    if fixed_lambda is None:
        if not p.min()<target<p.max(): raise ValueError(f'target {target} outside evaluated supply {p.min()}..{p.max()}')
        low,high=-32.,32.
        if at(low)[0]>target or at(high)[0]<target: raise ValueError('insufficient payout supply; retune strips before publishing')
        for _ in range(90):
            mid=(low+high)/2
            if at(mid)[0]<target:low=mid
            else:high=mid
        lam=(low+high)/2
    else:lam=fixed_lambda
    mean,w=at(lam)
    return w*mass,lam,mean

def extended_gcd(a,b):
    if not b:return a,1,0
    g,x,y=extended_gcd(b,a%b)
    return g,y,x-(a//b)*y

def integer_weights(payouts,probabilities,target):
    payouts=[int(x) for x in payouts]
    weights=[max(1,round(float(p)*TOTAL_WEIGHT)) for p in probabilities]
    free=[i for i,p in enumerate(payouts) if p<CAP]
    reference=max(free,key=lambda i:weights[i])
    weights[reference]+=TOTAL_WEIGHT-sum(weights)
    error=target*TOTAL_WEIGHT-sum(w*p for w,p in zip(weights,payouts))
    groups={}
    for i in free:
        p=payouts[i]
        if p not in groups or weights[i]>weights[groups[p]]:groups[p]=i
    base=min(groups);zero=groups[base]
    # First remove the large component with a high-span transfer.
    high=groups[max(groups)];span=payouts[high]-base
    shift=round(error/span)
    if weights[high]+shift>0 and weights[zero]-shift>0:
        weights[high]+=shift;weights[zero]-=shift;error-=shift*span
    if error:
        keys=sorted(p for p in groups if p!=base)
        solved=False
        for ia,p in enumerate(keys[:120]):
            for q in keys[ia+1:120]:
                g,a,b=extended_gcd(p-base,q-base)
                if error%g:continue
                a*=error//g;b*=error//g
                A,B=(q-base)//g,(p-base)//g
                centre=round(-a/A)
                for k in [centre,centre-1,centre+1,0]:
                    da,db=a+A*k,b-B*k;dz=-da-db
                    if min(weights[groups[p]]+da,weights[groups[q]]+db,weights[zero]+dz)>0:
                        weights[groups[p]]+=da;weights[groups[q]]+=db;weights[zero]+=dz
                        solved=True;break
                if solved:break
            if solved:break
        if not solved:raise ValueError('integer RTP correction has no safe solution in supplied books')
    assert all(w>0 for w in weights) and sum(weights)==TOTAL_WEIGHT
    assert sum(w*p for w,p in zip(weights,payouts))==target*TOTAL_WEIGHT
    return weights

def calibrate(mode,records,buy_profiles=None):
    cost={'base':1,'bonus':100,'bonus_hits':500,'bonus_epic':1000}[mode]
    target=96*cost
    payouts=[r['payout'] for r in records]
    groups=defaultdict(list)
    for i,r in enumerate(records):groups['cap' if mode!='base' and r['payout']==CAP else r['criteria']].append(i)
    if not groups['cap']:raise ValueError('max-win path missing')
    result=np.zeros(len(records));capmass=CAP_MASS[mode]
    result[groups['cap']]=capmass/len(groups['cap'])
    details={}
    if mode!='base':
        idx=[i for i,p in enumerate(payouts) if p<CAP]
        weights,lam,mean=profile([payouts[i] for i in idx],(target-capmass*CAP)/(1-capmass),1-capmass)
        result[idx]=weights;details['lambda']=lam
    else:
        feature_mass=1/350
        used=capmass*CAP
        for tier,share,buy in [('soldier',.94,'bonus'),('capo',.05,'bonus_hits'),('don',.01,'bonus_epic')]:
            idx=groups['trigger_'+tier]
            if not idx:raise ValueError(f'base supply missing {tier}')
            mass=feature_mass*share
            # Every bought feature is represented exactly once in this stratum.
            # Use its published probability rather than refitting a second pool.
            source=buy_profiles[buy]
            assert len(idx)==len(source)
            weights=np.asarray(source,dtype=float)/sum(source)*mass
            mean=float(weights@np.array([payouts[i] for i in idx])/mass)
            result[idx]=weights;used+=mass*mean
            details[tier]={'probability':mass,'meanBaseBetX':mean/100}
        idx=groups['ordinary'];mass=1-feature_mass-capmass
        weights,lam,mean=profile([payouts[i] for i in idx],(target-used)/mass,mass)
        result[idx]=weights;details['ordinaryLambda']=lam
    if np.any(result<=0):raise ValueError('unassigned strata; do not silently drop books')
    weights=integer_weights(payouts,result,target)
    return weights,details

def statistics(records,weights,cost):
    total=sum(weights);prob=np.array(weights,dtype=float)/total
    x=np.array([r['payout']/100 for r in records]);normal=x/cost
    order=np.argsort(x);cumulative=np.cumsum(prob[order])
    quantile=lambda q:float(x[order[min(len(order)-1,int(np.searchsorted(cumulative,q)))]]/cost)
    return {'books':len(records),'rtp':sum(w*r['payout'] for w,r in zip(weights,records))/total/100/cost,
            'meanBaseBetX':float(prob@x),'hitRate':float(prob@(x>0)),
            'profitProbability':float(prob@(x>cost)),'lossProbability':float(prob@(x<cost)),
            'breakEvenProbability':float(prob@(x==cost)),
            'stdDevCostUnits':float(np.sqrt(prob@((normal-.96)**2))),
            'medianCostUnits':quantile(.5),'p90CostUnits':quantile(.9),'p99CostUnits':quantile(.99),
            'maxWinBaseBetX':float(x.max()),'maxWinProbability':float(prob@(x==20000)),
            'p5000BaseBetX':float(prob@(x>=5000)),'p10000BaseBetX':float(prob@(x>=10000)),
            'maxSingleBookProbability':float(prob.max()),'effectiveBooks':float(1/(prob@prob))}

