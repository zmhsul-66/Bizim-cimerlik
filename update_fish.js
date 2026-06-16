const fs = require('fs');

async function updateFish() {
  const adminPassword = "deniz123";
  
  try {
    const res = await fetch('http://localhost:3000/api/items');
    const data = await res.json();
    const items = data.items;

    const updates = {
      'kabab-10': 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=600&auto=format&fit=crop&q=80', // Farel (setka)
      'kabab-11': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&auto=format&fit=crop&q=80', // Kefal (setka)
      'kabab-12': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&auto=format&fit=crop&q=80', // Kütüm (setka)
    };

    for (const item of items) {
      if (updates[item.id]) {
        const updatedItem = {
          ...item,
          image: updates[item.id]
        };
        console.log(`Updating image for: ${item.name}`);
        const putRes = await fetch('http://localhost:3000/api/items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
          body: JSON.stringify(updatedItem)
        });
        if (putRes.ok) {
          console.log(`Success: ${item.id}`);
        } else {
          console.error(`Failed: ${item.id}`, await putRes.text());
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

updateFish().then(() => console.log('Done.'));
