const kretaService = require('./kretaService');
const fs = require('fs');

async function run() {
  console.log('Megpróbálunk egy képernyőfotót és HTML dumpot készíteni a Tanított Tanulók oldalról...');
  if (!kretaService.page) {
    console.error('Még nincs bejelentkezve a szerver. Kérlek lépj be a React felületen először!');
    process.exit(1);
  }
  
  try {
    await kretaService.page.goto('https://bmszc-neumann.e-kreta.hu/Tanulo/TanarTanitottTanulok', { waitUntil: 'networkidle' });
    await kretaService.page.waitForTimeout(5000); // Várjunk biztosan
    
    await kretaService.page.screenshot({ path: 'tanulok_page.png' });
    console.log('Mentve: tanulok_page.png');
    
    const html = await kretaService.page.content();
    fs.writeFileSync('tanulok_page.html', html);
    console.log('Mentve: tanulok_page.html');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
