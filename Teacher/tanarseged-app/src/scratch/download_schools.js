import fs from 'fs';
import https from 'https';

const url = 'https://kretaglobalmobileapi.ekreta.hu/api/v1/Institute';

console.log('Downloading schools list from Kréta API...');

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const schools = JSON.parse(data);
      console.log(`Successfully downloaded ${schools.length} schools.`);
      
      // Clean data to keep it small
      const cleaned = schools.map(s => ({
        id: s.InstituteId,
        code: s.InstituteCode,
        name: s.Name,
        city: s.City,
        url: s.Url
      }));

      // Sort by city, then name
      cleaned.sort((a, b) => {
        const cityCompare = (a.city || '').localeCompare(b.city || '', 'hu');
        if (cityCompare !== 0) return cityCompare;
        return (a.name || '').localeCompare(b.name || '', 'hu');
      });

      const dir = './src/data';
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(`${dir}/schools.json`, JSON.stringify(cleaned, null, 2));
      console.log('Saved cleaned schools list to src/data/schools.json');
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  });

}).on('error', (err) => {
  console.error('Error downloading:', err.message);
});
