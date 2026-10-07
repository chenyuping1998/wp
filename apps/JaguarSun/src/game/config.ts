// Generated from math-sdk games/jaguar_sun/library/configs/config_fe_jaguar_sun.json
// Regenerate with design/sync_math_config.py after re-running the math.
export default {
	"providerName": "igs",
	"gameName": "jaguar_sun",
	"gameID": "JaguarSun",
	"rtp": 0.94,
	"numReels": 5,
	"numRows": [
		4,
		4,
		4,
		4,
		4
	],
	"betModes": {
		"base": {
			"cost": 1.0,
			"feature": true,
			"buyBonus": false,
			"rtp": 0.94,
			"max_win": 20000.0
		},
		"bonus": {
			"cost": 100.0,
			"feature": false,
			"buyBonus": true,
			"rtp": 0.94,
			"max_win": 20000.0
		},
		"bonus_hits": {
			"cost": 250.0,
			"feature": false,
			"buyBonus": true,
			"rtp": 0.94,
			"max_win": 20000.0
		}
	},
	"paylines": {
		"1": [
			0,
			0,
			0,
			0,
			0
		],
		"2": [
			1,
			1,
			1,
			1,
			1
		],
		"3": [
			2,
			2,
			2,
			2,
			2
		],
		"4": [
			3,
			3,
			3,
			3,
			3
		],
		"5": [
			0,
			1,
			2,
			1,
			0
		],
		"6": [
			1,
			2,
			3,
			2,
			1
		],
		"7": [
			3,
			2,
			1,
			2,
			3
		],
		"8": [
			2,
			1,
			0,
			1,
			2
		],
		"9": [
			0,
			1,
			1,
			1,
			0
		],
		"10": [
			1,
			2,
			2,
			2,
			1
		],
		"11": [
			2,
			1,
			1,
			1,
			2
		],
		"12": [
			3,
			2,
			2,
			2,
			3
		],
		"13": [
			0,
			1,
			0,
			1,
			0
		],
		"14": [
			3,
			2,
			3,
			2,
			3
		]
	},
	"symbols": {
		"W": {
			"paytable": [
				{
					"5": 200
				}
			],
			"special_properties": [
				"wild"
			]
		},
		"S": {
			"paytable": null,
			"special_properties": [
				"scatter"
			]
		},
		"H1": {
			"paytable": [
				{
					"5": 200
				},
				{
					"4": 50
				},
				{
					"3": 20
				}
			]
		},
		"H2": {
			"paytable": [
				{
					"5": 100
				},
				{
					"4": 30
				},
				{
					"3": 10
				}
			]
		},
		"H3": {
			"paytable": [
				{
					"5": 25
				},
				{
					"4": 10
				},
				{
					"3": 2
				}
			]
		},
		"H4": {
			"paytable": [
				{
					"5": 15
				},
				{
					"4": 5
				},
				{
					"3": 1
				}
			]
		},
		"H5": {
			"paytable": [
				{
					"5": 5
				},
				{
					"4": 2
				},
				{
					"3": 0.5
				}
			]
		},
		"L1": {
			"paytable": [
				{
					"5": 1.0
				},
				{
					"4": 0.5
				},
				{
					"3": 0.2
				}
			]
		},
		"L2": {
			"paytable": [
				{
					"5": 1.0
				},
				{
					"4": 0.5
				},
				{
					"3": 0.2
				}
			]
		},
		"L3": {
			"paytable": [
				{
					"5": 1.0
				},
				{
					"4": 0.5
				},
				{
					"3": 0.2
				}
			]
		},
		"L4": {
			"paytable": [
				{
					"5": 1.0
				},
				{
					"4": 0.5
				},
				{
					"3": 0.2
				}
			]
		}
	},
	"paddingReels": {
		"basegame": [
			[
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H5"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "S"
				},
				{
					"name": "L3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H5"
				},
				{
					"name": "H4"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L3"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				}
			],
			[
				{
					"name": "L3"
				},
				{
					"name": "H3"
				},
				{
					"name": "L3"
				},
				{
					"name": "H5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "H1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "S"
				},
				{
					"name": "L2"
				},
				{
					"name": "W"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "H1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H2"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				}
			],
			[
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H1"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H2"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "S"
				},
				{
					"name": "W"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H5"
				}
			],
			[
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "S"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "W"
				},
				{
					"name": "L1"
				},
				{
					"name": "H2"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H5"
				},
				{
					"name": "H2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "W"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "S"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				}
			],
			[
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "S"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H2"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "W"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "H1"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "S"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H1"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "W"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				}
			]
		],
		"freegame": [
			[
				{
					"name": "S"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H1"
				},
				{
					"name": "H5"
				},
				{
					"name": "W"
				},
				{
					"name": "H2"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "W"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "H3"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				}
			],
			[
				{
					"name": "H2"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "W"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "W"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				},
				{
					"name": "S"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "W"
				},
				{
					"name": "L2"
				},
				{
					"name": "H1"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				}
			],
			[
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H2"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "S"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H2"
				},
				{
					"name": "H5"
				},
				{
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "H1"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "H1"
				},
				{
					"name": "H2"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "W"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "H4"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H2"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H1"
				}
			],
			[
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H4"
				},
				{
					"name": "S"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H5"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "W"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "S"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "H2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H1"
				},
				{
					"name": "H2"
				},
				{
					"name": "H1"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "L4"
				},
				{
					"name": "H1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				}
			],
			[
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "S"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H1"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "W"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "W"
				},
				{
					"name": "S"
				},
				{
					"name": "L2"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				}
			]
		]
	},
	"featureRules": {
		"initialSpins": 10,
		"triggerScatters": {
			"midnight_passage": 3,
			"phantom_express": 4
		},
		"retriggerAwards": {
			"2": 2,
			"3": 4,
			"4": 6,
			"5": 8
		},
		"maxMultiplier": 200,
		"premiumStep": 5,
		"wheelValues": {
			"midnight_passage": [
				2,
				4,
				6,
				8,
				10,
				12,
				16,
				20,
				30,
				40,
				50,
				60,
				80,
				100,
				150,
				200
			],
			"phantom_express": [
				10,
				20,
				30,
				40,
				50,
				60,
				70,
				80,
				90,
				100,
				110,
				120,
				130,
				140,
				150,
				160,
				170,
				180,
				190,
				200
			]
		}
	}
} as const;
