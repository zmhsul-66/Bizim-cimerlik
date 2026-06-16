const fs = require('fs');

async function repairNames() {
  const adminPassword = "deniz123";
  
  // 1. Fetch current items correctly using fetch (no PowerShell corruption)
  const response = await fetch('http://localhost:3000/api/items');
  const data = await response.json();
  const items = data.items;

  const nameFixes = {
    'tava-9': 'Farel qızartma / Жарка фареля',
    'tava-10': 'Kefal qızartma / Жареная кефаль',
    'tava-11': 'Kütüm qızartma / Жареный кутум',
    'tava-12': 'Naggets / Нагетсы',
    'tava-7': 'Kartof fri / Картофель фри',
    'seher-5': 'Pomidor - yumurta (kərə yağında) / Яичница с помидорами',
    'alk-5': 'Fanta, Cola / Фанта, Кола',
    'alk-9': 'Düşes, Tərxun / Дюшес, Тархун',
    'isti-1': 'Çay / Чай',
    'alko-3': 'Araq (Çarskaya çeşidləri) / Водка (Царская)',
    'alko-4': 'Araq (Çetkaya, Ruskiy Dar, Delikat) / Водка (Четкая, Русский Дар, Деликат)',
    'cerez-11': 'Dondurma / Мороженое',
    'kabab-5': 'Toyuq / Шашлык из курицы',
    'kabab-8': 'Közləmə kartof / Картошка на углях'
  };

  const ingredientsFixes = {
    'alko-3': '0.5 / 0.75 lt.',
    'alko-4': '0.5 / 0.75 lt.'
  };

  for (const item of items) {
    if (nameFixes[item.id]) {
      const updatedItem = {
        ...item,
        name: nameFixes[item.id],
        ingredients: ingredientsFixes[item.id] || ""
      };
      console.log(`Fixing ${item.id} -> ${updatedItem.name}`);
      
      try {
        const res = await fetch('http://localhost:3000/api/items', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPassword
          },
          body: JSON.stringify(updatedItem)
        });
        
        if (!res.ok) {
          console.error(`Failed to update ${item.id}:`, await res.text());
        } else {
          console.log(`Success: ${item.id}`);
        }
      } catch (err) {
        console.error(`Error on ${item.id}:`, err.message);
      }
    }
  }
}

repairNames().then(() => console.log('Done.'));
