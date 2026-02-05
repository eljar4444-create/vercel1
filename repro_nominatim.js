
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function fetchMajorCities() {
    const cities = [
        "Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main", "Stuttgart",
        "Düsseldorf", "Dortmund", "Essen", "Leipzig", "Bremen", "Dresden",
        "Hannover", "Nürnberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld",
        "Bonn", "Münster", "Kiel"
    ];

    console.log("const MAJOR_CITIES = [");
    for (const city of cities) {
        const params = new URLSearchParams({
            q: city,
            format: 'json',
            addressdetails: '1',
            limit: '1',
            countrycodes: 'de',
            'accept-language': 'ru'
        });

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
                headers: { 'User-Agent': 'Svoi.de-Debug-Script/1.0' }
            });
            const data = await response.json();
            if (data[0]) {
                const item = data[0];
                const name = city.toLowerCase();
                // handle special chars like ü -> u/ue
                const simpleName = name.replace('ü', 'u').replace('ö', 'o').replace('ä', 'a').replace('ß', 'ss');

                const nameRu = item.display_name.split(',')[0].toLowerCase();

                let triggers = [name[0]];
                if (nameRu[0] !== name[0]) triggers.push(nameRu[0]);
                triggers.push(name.substring(0, 2));
                if (nameRu.length >= 2) triggers.push(nameRu.substring(0, 2));

                // Add simple name variations
                triggers.push(simpleName[0]);
                triggers.push(simpleName.substring(0, 2));

                triggers = [...new Set(triggers)];

                console.log(`  {`);
                console.log(`    names: ["${name}", "${simpleName}", "${nameRu}"],`);
                console.log(`    triggers: ${JSON.stringify(triggers)},`);
                console.log(`    data: {`);
                console.log(`       place_id: ${item.place_id},`);
                console.log(`       osm_id: ${item.osm_id},`);
                console.log(`       osm_type: "${item.osm_type}",`);
                console.log(`       lat: "${item.lat}",`);
                console.log(`       lon: "${item.lon}",`);
                console.log(`       display_name: "${item.display_name.replace(/"/g, '\\"')}",`);
                console.log(`       class: "${item.class}",`);
                console.log(`       type: "${item.type}",`);
                console.log(`       importance: ${item.importance},`);
                console.log(`       address: ${JSON.stringify(item.address)}`);
                console.log(`    }`);
                console.log(`  },`);
            }
        } catch (e) {
            console.error(e);
        }
        await new Promise(r => setTimeout(r, 1100)); // Rate limit respect
    }
    console.log("];");
}

fetchMajorCities();
