const fs = require('fs');
const p = 'src/app/pincode/[code]/page.js';
let s = fs.readFileSync(p, 'utf8');
const before = s;

// Edit 1: add address field to data extraction
s = s.replace(
  /category_name: data\.category_name \|\| data\.category \|\| 'Other',\s+area: data\.area \|\| '',/,
  `category_name: data.category_name || data.category || 'Other',
            address: (data.address && data.address !== '-') ? data.address : '',
            area: data.area || '',`
);

// Edit 2: add address line after the shopMeta div
s = s.replace(
  /\{shop\.area && <span style=\{styles\.areaTag\}>\{shop\.area\}<\/span>\}\s+<\/div>\s+<\/div>\s+\)\)\}/,
  `{shop.area && <span style={styles.areaTag}>{shop.area}</span>}
                  </div>
                  {shop.address && <div style={styles.addressLine}>{shop.address}</div>}
                </div>
              ))}`
);

// Edit 3: add addressLine style
s = s.replace(
  /areaTag: \{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#666' \},/,
  `areaTag: { fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#666' },
  addressLine: { fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#666', marginTop: 6, lineHeight: 1.4 },`
);

if (s === before) {
  console.log('ERROR: No changes applied. Patterns did not match. File unchanged.');
  process.exit(1);
}
fs.writeFileSync(p, s);
console.log('Patch applied successfully');
