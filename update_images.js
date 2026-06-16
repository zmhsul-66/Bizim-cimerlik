const fs = require('fs');

async function updateItems() {
  const adminPassword = "deniz123";
  let rawData = fs.readFileSync('items_utf8.json', 'utf8');
  if (rawData.charCodeAt(0) === 0xFEFF) {
    rawData = rawData.slice(1);
  }
  const itemsFile = JSON.parse(rawData);
  const items = itemsFile.items;

  // Map of ID to new image URL
  const updates = {
    'tava-9': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80', // Farel
    'tava-10': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&auto=format&fit=crop&q=80', // Kefal
    'tava-11': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&auto=format&fit=crop&q=80', // Kütüm
    'tava-12': 'https://images.unsplash.com/photo-1562967914-608f82629a7a?w=600&auto=format&fit=crop&q=80', // Naggets
    'tava-7': 'https://images.unsplash.com/photo-1576107223947-2f132e01df07?w=600&auto=format&fit=crop&q=80', // Kartof fri
    'seher-5': 'https://images.unsplash.com/photo-1614533036665-27a3875be41d?w=600&auto=format&fit=crop&q=80', // Pomidor yumurta
    'alk-5': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80', // Cola
    'alk-9': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80', // Tərxun
    'isti-1': 'https://images.unsplash.com/photo-1595267866380-60b2eb5963de?w=600&auto=format&fit=crop&q=80', // Çay
    'alko-3': 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=600&auto=format&fit=crop&q=80', // Araq
    'alko-4': 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=600&auto=format&fit=crop&q=80', // Araq
    'cerez-11': 'https://images.unsplash.com/photo-1557142046-c704a3adf8f6?w=600&auto=format&fit=crop&q=80', // Dondurma
    'kabab-5': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80', // Toyuq kabab
    'kabab-8': 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80' // Közləmə kartof
  };

  for (const item of items) {
    if (updates[item.id]) {
      const updatedItem = {
        ...item,
        image: updates[item.id]
      };
      console.log(`Updating ${item.name} (${item.id})`);
      
      try {
        const response = await fetch('http://localhost:3000/api/items', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPassword
          },
          body: JSON.stringify(updatedItem)
        });
        
        if (!response.ok) {
          console.error(`Failed to update ${item.id}:`, await response.text());
        } else {
          console.log(`Success: ${item.id}`);
        }
      } catch (err) {
        console.error(`Error on ${item.id}:`, err.message);
      }
    }
  }
}

updateItems().then(() => console.log('Done.'));
