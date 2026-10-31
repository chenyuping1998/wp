"""Shape-preserving cubic motion: flow through waypoints, stop at real holds.

Weighted harmonic tangents keep each component inside its authored range.
Endpoints and plateaus have zero velocity; monotone intermediate waypoints do
not create a full stop. Samples stay explicit for the Spine editor/runtime.
"""
import math

def bake_curve(keys,fps=60):
    if len(keys)<2:return keys
    times=[k[0] for k in keys];dims=len(keys[0])-1
    h=[b-a for a,b in zip(times,times[1:])]
    assert all(dt>0 for dt in h),keys
    slopes=[]
    for d in range(dims):
        secants=[(b[d+1]-a[d+1])/dt for a,b,dt in zip(keys,keys[1:],h)]
        m=[0.]*len(keys)
        for i in range(1,len(keys)-1):
            a,b=secants[i-1:i+1]
            if a*b>0:
                w1=2*h[i]+h[i-1];w2=h[i]+2*h[i-1]
                m[i]=(w1+w2)/(w1/a+w2/b)
        slopes.append(m)
    out=[]
    for i,(a,b) in enumerate(zip(keys,keys[1:])):
        dt=h[i];n=max(1,math.ceil(dt*fps))
        for j in range(n):
            u=j/n;aa=2*u**3-3*u*u+1;bb=u**3-2*u*u+u;cc=-2*u**3+3*u*u;dd=u**3-u*u
            values=[aa*a[d+1]+bb*dt*slopes[d][i]+cc*b[d+1]+dd*dt*slopes[d][i+1] for d in range(dims)]
            out.append((round(a[0]+dt*u,6),*[round(v,6) for v in values]))
    return out+[keys[-1]]
