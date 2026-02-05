const MAJOR_CITIES = [
  {
    names: ["berlin", "berlin", "берлин"],
    triggers: ["b","б","be","бе"],
    data: {
       place_id: 134131805,
       osm_id: 62422,
       osm_type: "relation",
       lat: "52.5173885",
       lon: "13.3951309",
       display_name: "Берлин, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.8522196536088086,
       address: {"city":"Берлин","ISO3166-2-lvl4":"DE-BE","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["hamburg", "hamburg", "гамбург"],
    triggers: ["h","г","ha","га"],
    data: {
       place_id: 129789555,
       osm_id: 62782,
       osm_type: "relation",
       lat: "53.5503410",
       lon: "10.0006540",
       display_name: "Гамбург, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7877290162608149,
       address: {"city":"Гамбург","ISO3166-2-lvl4":"DE-HH","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["münchen", "munchen", "мюнхен"],
    triggers: ["m","м","mü","мю","mu"],
    data: {
       place_id: 117581410,
       osm_id: 62428,
       osm_type: "relation",
       lat: "48.1371079",
       lon: "11.5753822",
       display_name: "Мюнхен, Бавария, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.8105981661589455,
       address: {"city":"Мюнхен","state":"Бавария","ISO3166-2-lvl4":"DE-BY","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["köln", "koln", "кёльн"],
    triggers: ["k","к","kö","кё","ko"],
    data: {
       place_id: 106066015,
       osm_id: 62578,
       osm_type: "relation",
       lat: "50.9383610",
       lon: "6.9599740",
       display_name: "Кёльн, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7583028574734825,
       address: {"city":"Кёльн","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["frankfurt am main", "frankfurt am main", "франкфурт-на-майне"],
    triggers: ["f","ф","fr","фр"],
    data: {
       place_id: 127334826,
       osm_id: 62400,
       osm_type: "relation",
       lat: "50.1106444",
       lon: "8.6820917",
       display_name: "Франкфурт-на-Майне, Гессен, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7473970382925892,
       address: {"city":"Франкфурт-на-Майне","state":"Гессен","ISO3166-2-lvl4":"DE-HE","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["stuttgart", "stuttgart", "штутгарт"],
    triggers: ["s","ш","st","шт"],
    data: {
       place_id: 112463238,
       osm_id: 2793104,
       osm_type: "relation",
       lat: "48.7784485",
       lon: "9.1800132",
       display_name: "Штутгарт, Баден-Вюртемберг, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7482923125603024,
       address: {"city":"Штутгарт","state":"Баден-Вюртемберг","ISO3166-2-lvl4":"DE-BW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["düsseldorf", "dusseldorf", "дюссельдорф"],
    triggers: ["d","д","dü","дю","du"],
    data: {
       place_id: 102124007,
       osm_id: 62539,
       osm_type: "relation",
       lat: "51.2254018",
       lon: "6.7763137",
       display_name: "Дюссельдорф, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7310605525031979,
       address: {"city":"Дюссельдорф","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["dortmund", "dortmund", "дортмунд"],
    triggers: ["d","д","do","до"],
    data: {
       place_id: 103955318,
       osm_id: 1829065,
       osm_type: "relation",
       lat: "51.5142273",
       lon: "7.4652789",
       display_name: "Дортмунд, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.6915985025910664,
       address: {"city":"Дортмунд","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["essen", "essen", "эссен"],
    triggers: ["e","э","es","эс"],
    data: {
       place_id: 104843303,
       osm_id: 62713,
       osm_type: "relation",
       lat: "51.4582235",
       lon: "7.0158171",
       display_name: "Эссен, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.680956649072511,
       address: {"city":"Эссен","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["leipzig", "leipzig", "лейпциг"],
    triggers: ["l","л","le","ле"],
    data: {
       place_id: 122443039,
       osm_id: 62649,
       osm_type: "relation",
       lat: "51.3406321",
       lon: "12.3747329",
       display_name: "Лейпциг, Саксония, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7550072069908552,
       address: {"city":"Лейпциг","state":"Саксония","ISO3166-2-lvl4":"DE-SN","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["bremen", "bremen", "бремен"],
    triggers: ["b","б","br","бр"],
    data: {
       place_id: 131174968,
       osm_id: 62559,
       osm_type: "relation",
       lat: "53.0758196",
       lon: "8.8071646",
       display_name: "Бремен, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7127197721039941,
       address: {"city":"Бремен","state":"Бремен","ISO3166-2-lvl4":"DE-HB","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["dresden", "dresden", "дрезден"],
    triggers: ["d","д","dr","др"],
    data: {
       place_id: 124024151,
       osm_id: 191645,
       osm_type: "relation",
       lat: "51.0493286",
       lon: "13.7381437",
       display_name: "Дрезден, Саксония, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7441063589631615,
       address: {"city":"Дрезден","state":"Саксония","ISO3166-2-lvl4":"DE-SN","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["hannover", "hannover", "ганновер"],
    triggers: ["h","г","ha","га"],
    data: {
       place_id: 129699568,
       osm_id: 59418,
       osm_type: "relation",
       lat: "52.3744779",
       lon: "9.7385532",
       display_name: "Ганновер, Нижняя Саксония, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7210693104911785,
       address: {"city":"Ганновер","county":"Ганновер","state":"Нижняя Саксония","ISO3166-2-lvl4":"DE-NI","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["nürnberg", "nurnberg", "нюрнберг"],
    triggers: ["n","н","nü","ню","nu"],
    data: {
       place_id: 426348922,
       osm_id: 62780,
       osm_type: "relation",
       lat: "49.4538720",
       lon: "11.0772980",
       display_name: "Нюрнберг, Бавария, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7176013348002949,
       address: {"city":"Нюрнберг","state":"Бавария","ISO3166-2-lvl4":"DE-BY","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["duisburg", "duisburg", "дуйсбург"],
    triggers: ["d","д","du","ду"],
    data: {
       place_id: 102676247,
       osm_id: 62456,
       osm_type: "relation",
       lat: "51.4349990",
       lon: "6.7595620",
       display_name: "Дуйсбург, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.6639563873859237,
       address: {"city":"Дуйсбург","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["bochum", "bochum", "бохум"],
    triggers: ["b","б","bo","бо"],
    data: {
       place_id: 104523994,
       osm_id: 62644,
       osm_type: "relation",
       lat: "51.4818111",
       lon: "7.2196635",
       display_name: "Бохум, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.6491974253685446,
       address: {"city":"Бохум","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["wuppertal", "wuppertal", "вупперталь"],
    triggers: ["w","в","wu","ву"],
    data: {
       place_id: 105383149,
       osm_id: 62478,
       osm_type: "relation",
       lat: "51.2640180",
       lon: "7.1780374",
       display_name: "Вупперталь, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.6394718697536554,
       address: {"city":"Вупперталь","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["bielefeld", "bielefeld", "билефельд"],
    triggers: ["b","б","bi","би"],
    data: {
       place_id: 129722388,
       osm_id: 62646,
       osm_type: "relation",
       lat: "52.0191005",
       lon: "8.5310070",
       display_name: "Билефельд, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.6357117079663522,
       address: {"city":"Билефельд","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["bonn", "bonn", "бонн"],
    triggers: ["b","б","bo","бо"],
    data: {
       place_id: 106062205,
       osm_id: 62508,
       osm_type: "relation",
       lat: "50.7352621",
       lon: "7.1024635",
       display_name: "Бонн, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.7109775087424762,
       address: {"city":"Бонн","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["münster", "munster", "мюнстер"],
    triggers: ["m","м","mü","мю","mu"],
    data: {
       place_id: 104030207,
       osm_id: 62591,
       osm_type: "relation",
       lat: "51.9625101",
       lon: "7.6251879",
       display_name: "Мюнстер, Северный Рейн — Вестфалия, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.6763885992290051,
       address: {"city":"Мюнстер","state":"Северный Рейн — Вестфалия","ISO3166-2-lvl4":"DE-NW","country":"Германия","country_code":"de"}
    }
  },
  {
    names: ["kiel", "kiel", "киль"],
    triggers: ["k","к","ki","ки"],
    data: {
       place_id: 138349840,
       osm_id: 27021,
       osm_type: "relation",
       lat: "54.3227085",
       lon: "10.1355550",
       display_name: "Киль, Шлезвиг-Гольштейн, Германия",
       class: "boundary",
       type: "administrative",
       importance: 0.693398749520952,
       address: {"city":"Киль","state":"Шлезвиг-Гольштейн","ISO3166-2-lvl4":"DE-SH","country":"Германия","country_code":"de"}
    }
  },
];
