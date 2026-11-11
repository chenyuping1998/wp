"""Go Banandit: simulate books, optimise, analyse, verify."""
from gamestate import GameState
from game_config import GameConfig
from game_optimization import OptimizationSetup
from optimization_program.run_script import OptimizationExecution
from utils.game_analytics.run_analysis import create_stat_sheet
from utils.rgs_verification import execute_all_tests
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs

if __name__ == "__main__":

    num_threads = 10
    rust_threads = 20
    batching_size = 50000
    compression = True
    profiling = False

    import os

    # SIMS=2000 PROBE=1 python run.py  -> quick natural-distribution probe, no optimizer
    sims = int(os.environ.get("SIMS", 1e5))
    probe = os.environ.get("PROBE") == "1"
    num_sim_args = {
        "base": sims,
        "bonus": sims // 2,
        "superbonus": sims // 2,
    }

    run_conditions = {
        "run_sims": True,
        "run_optimization": not probe,
        "run_analysis": not probe,
        "run_format_checks": not probe,
    }
    target_modes = ["base", "bonus", "superbonus"]

    config = GameConfig()
    gamestate = GameState(config)
    if run_conditions["run_optimization"] or run_conditions["run_analysis"]:
        optimization_setup_class = OptimizationSetup(config)

    if run_conditions["run_sims"]:
        create_books(
            gamestate,
            config,
            num_sim_args,
            batching_size,
            num_threads,
            compression,
            profiling,
        )

    generate_configs(gamestate)

    if run_conditions["run_optimization"]:
        OptimizationExecution().run_all_modes(config, target_modes, rust_threads)
        generate_configs(gamestate)

    if run_conditions["run_analysis"]:
        custom_keys = [{"symbol": "scatter"}]
        create_stat_sheet(gamestate, custom_keys=custom_keys)

    if run_conditions["run_format_checks"]:
        execute_all_tests(config)
