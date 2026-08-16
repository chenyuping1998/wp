export default {
	"providerName": "sample_provider",
	"gameName": "go_bananas_100",
	"gameID": "GoBananas100",
	"rtp": 0.92,
	"numReels": 5,
	"numRows": [
		5,
		5,
		5,
		5,
		5
	],
	"betModes": {
		"base": {
			"cost": 1,
			"feature": true,
			"buyBonus": false,
			"rtp": 0.92,
			"max_win": 25000
		},
		"bonus": {
			"cost": 200,
			"feature": false,
			"buyBonus": true,
			"rtp": 0.92,
			"max_win": 25000
		},
		"superbonus": {
			"cost": 500,
			"feature": false,
			"buyBonus": true,
			"rtp": 0.92,
			"max_win": 25000
		},
		"superspin": {
			"cost": 50,
			"feature": false,
			"buyBonus": true,
			"rtp": 0.92,
			"max_win": 2000
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
			4,
			4,
			4,
			4,
			4
		],
		"6": [
			0,
			1,
			0,
			1,
			0
		],
		"7": [
			1,
			2,
			1,
			2,
			1
		],
		"8": [
			2,
			3,
			2,
			3,
			2
		],
		"9": [
			3,
			4,
			3,
			4,
			3
		],
		"10": [
			1,
			0,
			1,
			0,
			1
		],
		"11": [
			2,
			1,
			2,
			1,
			2
		],
		"12": [
			3,
			2,
			3,
			2,
			3
		],
		"13": [
			4,
			3,
			4,
			3,
			4
		],
		"14": [
			0,
			1,
			2,
			3,
			4
		],
		"15": [
			4,
			3,
			2,
			1,
			0
		]
	},
	"symbols": {
		"W": {
			"paytable": [
				{
					"3": 5
				},
				{
					"4": 10
				},
				{
					"5": 20
				}
			],
			"special_properties": [
				"wild",
				"multiplier"
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
					"3": 5
				},
				{
					"4": 10
				},
				{
					"5": 20
				}
			]
		},
		"H2": {
			"paytable": [
				{
					"3": 3
				},
				{
					"4": 5
				},
				{
					"5": 15
				}
			]
		},
		"H3": {
			"paytable": [
				{
					"3": 2
				},
				{
					"4": 3
				},
				{
					"5": 10
				}
			]
		},
		"H4": {
			"paytable": [
				{
					"3": 1
				},
				{
					"4": 2
				},
				{
					"5": 8
				}
			]
		},
		"L1": {
			"paytable": [
				{
					"3": 0.5
				},
				{
					"4": 1
				},
				{
					"5": 5
				}
			]
		},
		"L2": {
			"paytable": [
				{
					"3": 0.3
				},
				{
					"4": 0.7
				},
				{
					"5": 3
				}
			]
		},
		"L3": {
			"paytable": [
				{
					"3": 0.3
				},
				{
					"4": 0.7
				},
				{
					"5": 3
				}
			]
		},
		"L4": {
			"paytable": [
				{
					"3": 0.2
				},
				{
					"4": 0.5
				},
				{
					"5": 2
				}
			]
		},
		"L5": {
			"paytable": [
				{
					"3": 0.2
				},
				{
					"4": 0.5
				},
				{
					"5": 2
				}
			]
		},
		"X": {
			"paytable": null
		},
		"P": {
			"paytable": null,
			"special_properties": [
				"prize"
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
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
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
					"name": "H3"
				},
				{
					"name": "S"
				},
				{
					"name": "L5"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
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
					"name": "H1"
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
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H2"
				},
				{
					"name": "H1"
				},
				{
					"name": "H1"
				},
				{
					"name": "L5"
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
					"name": "L4"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "L5"
				},
				{
					"name": "S"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
				},
				{
					"name": "L5"
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
					"name": "H3"
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
					"name": "H1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L2"
				},
				{
					"name": "S"
				},
				{
					"name": "H1"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
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
					"name": "L4"
				},
				{
					"name": "H1"
				},
				{
					"name": "L5"
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
					"name": "H4"
				},
				{
					"name": "L5"
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
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "S"
				},
				{
					"name": "L5"
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
					"name": "L3"
				}
			],
			[
				{
					"name": "H3"
				},
				{
					"name": "H3"
				},
				{
					"name": "H1"
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
					"name": "L5"
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
					"name": "L5"
				},
				{
					"name": "L3"
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
					"name": "S"
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
					"name": "L5"
				},
				{
					"name": "H2"
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
					"name": "L5"
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
					"name": "H2"
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
					"name": "L2"
				},
				{
					"name": "L3"
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
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
				},
				{
					"name": "H1"
				},
				{
					"name": "H1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
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
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
				},
				{
					"name": "H1"
				},
				{
					"name": "L5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L5"
				},
				{
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "H3"
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
					"name": "L5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				}
			],
			[
				{
					"name": "L5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "L5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "S"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
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
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "S"
				},
				{
					"name": "L1"
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
					"name": "H4"
				},
				{
					"name": "H4"
				},
				{
					"name": "H4"
				},
				{
					"name": "L5"
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
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
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
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L1"
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
					"name": "L5"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
				},
				{
					"name": "L3"
				},
				{
					"name": "S"
				},
				{
					"name": "H1"
				},
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
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "L3"
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
					"name": "L3"
				},
				{
					"name": "L3"
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
					"name": "L4"
				},
				{
					"name": "H4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
				},
				{
					"name": "L4"
				},
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
					"name": "L5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
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
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
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
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "S"
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
					"name": "L5"
				},
				{
					"name": "L1"
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
					"name": "L1"
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
					"name": "H4"
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
					"name": "L3"
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
					"name": "H1"
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
					"name": "H2"
				},
				{
					"name": "L5"
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
					"name": "H3"
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
					"name": "L1"
				},
				{
					"name": "L3"
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
					"name": "L3"
				},
				{
					"name": "L3"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "H2"
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
					"name": "L5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H1"
				},
				{
					"name": "H3"
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
					"name": "H1"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				}
			],
			[
				{
					"name": "L3"
				},
				{
					"name": "L5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "L1"
				},
				{
					"name": "S"
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
					"name": "H2"
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
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H4"
				},
				{
					"name": "S"
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
					"name": "L1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H1"
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
					"name": "H4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L3"
				},
				{
					"name": "L3"
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
					"name": "S"
				},
				{
					"name": "H3"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
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
					"name": "H2"
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
					"name": "L5"
				},
				{
					"name": "L5"
				},
				{
					"name": "S"
				},
				{
					"name": "H3"
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
					"name": "L4"
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
					"name": "H1"
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
					"name": "L3"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L5"
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
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				}
			]
		],
		"freegame": [
			[
				{
					"name": "L5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
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
					"name": "H4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
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
					"name": "L5"
				},
				{
					"name": "L2"
				},
				{
					"name": "H2"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "L2"
				},
				{
					"name": "L5"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L2"
				},
				{
					"name": "L5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H3"
				},
				{
					"name": "H3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H1"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
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
					"name": "L5"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
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
					"name": "H4"
				},
				{
					"name": "L2"
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
					"name": "L4"
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
					"name": "H4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
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
					"name": "L4"
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
				},
				{
					"name": "L5"
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
					"name": "H1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
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
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H3"
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
					"name": "L5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "H4"
				},
				{
					"name": "H1"
				},
				{
					"name": "L5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
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
					"name": "L4"
				},
				{
					"name": "L4"
				},
				{
					"name": "H4"
				},
				{
					"name": "H1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "H1"
				},
				{
					"name": "H1"
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
					"name": "L5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "L2"
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
					"name": "H2"
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
					"name": "L4"
				},
				{
					"name": "H4"
				},
				{
					"name": "L5"
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
					"name": "L5"
				},
				{
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "H3"
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
					"name": "L2"
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
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "H1"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L3"
				}
			],
			[
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
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L5"
				},
				{
					"name": "H4"
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
					"name": "L4"
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
					"name": "L2"
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
					"name": "L2"
				},
				{
					"name": "L3"
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
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
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
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H2"
				},
				{
					"name": "H1"
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
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
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
					"name": "H4"
				},
				{
					"name": "H4"
				},
				{
					"name": "H1"
				},
				{
					"name": "L5"
				},
				{
					"name": "H1"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
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
					"name": "L4"
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
					"name": "H2"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "L5"
				},
				{
					"name": "L1"
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
					"name": "L4"
				},
				{
					"name": "L5"
				}
			],
			[
				{
					"name": "H3"
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
					"name": "H2"
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
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L2"
				},
				{
					"name": "L5"
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
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H1"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
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
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "H3"
				},
				{
					"name": "H1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
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
					"name": "L4"
				},
				{
					"name": "H2"
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
					"name": "H2"
				},
				{
					"name": "L5"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
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
					"name": "L4"
				},
				{
					"name": "L5"
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
					"name": "H1"
				},
				{
					"name": "L1"
				},
				{
					"name": "L5"
				},
				{
					"name": "H2"
				},
				{
					"name": "H1"
				},
				{
					"name": "L5"
				},
				{
					"name": "L1"
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
					"name": "H1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L5"
				},
				{
					"name": "H1"
				},
				{
					"name": "H1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L3"
				},
				{
					"name": "H3"
				}
			],
			[
				{
					"name": "L5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
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
					"name": "H1"
				},
				{
					"name": "L5"
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
					"name": "L1"
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
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "L1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "H1"
				},
				{
					"name": "L3"
				},
				{
					"name": "H4"
				},
				{
					"name": "H2"
				},
				{
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L5"
				},
				{
					"name": "H3"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "H2"
				},
				{
					"name": "H2"
				},
				{
					"name": "L5"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
				},
				{
					"name": "L2"
				},
				{
					"name": "L5"
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
					"name": "L5"
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
					"name": "L2"
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
					"name": "L3"
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
					"name": "H3"
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
					"name": "L3"
				},
				{
					"name": "L4"
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
					"name": "L5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L4"
				},
				{
					"name": "L5"
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
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
				}
			]
		],
		"superspin": [
			[
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				}
			],
			[
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				}
			],
			[
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				}
			],
			[
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				}
			],
			[
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "P"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				},
				{
					"name": "X"
				}
			]
		]
	}
};
