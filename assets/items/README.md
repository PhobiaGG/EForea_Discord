# Item Assets Directory

This directory contains pixel art images for game items.

## Structure

```
assets/
└── items/
    ├── wooden_sword.png
    ├── iron_sword.png
    ├── leather_helmet.png
    └── ... (more items)
```

## File Naming Convention

- Use **lowercase** letters only
- Use **underscores** instead of spaces
- Match the item ID exactly
- Supported formats: PNG, JPG, GIF

## Examples

| Item ID | Filename |
|---------|----------|
| `wooden_sword` | `wooden_sword.png` |
| `iron_helmet` | `iron_helmet.png` |
| `health_potion` | `health_potion.png` |

## Adding New Images

1. Create your pixel art (recommended: 64x64 pixels)
2. Save as PNG with transparency
3. Name it matching the item ID
4. Place in this directory
5. Add `"image": "assets/items/your_item.png"` to items.json

## Using URLs Instead

You can also use image URLs instead of local files:

```json
"image": "https://i.imgur.com/abc123.png"
```

See `PIXEL_ART_GUIDE.md` for detailed instructions.

## Current Items

To add images for all current items, create pixel art for:

### Weapons
- wooden_sword
- iron_sword
- steel_greatsword
- enchanted_staff

### Armor
- leather_helmet
- leather_chestplate
- leather_greaves
- leather_gauntlets
- iron_helmet
- iron_chestplate
- steel_plate_armor

### Accessories
- bronze_ring
- silver_amulet
- warrior_pendant
- vampiric_ring

### Consumables
- health_potion
- mana_potion
- strength_elixir

### Materials
- copper_ore
- iron_ore
- wood
- leather
- magic_crystal

### Tools
- wooden_pickaxe
- iron_pickaxe
- wooden_axe
- fishing_rod

## Tips

- Keep file sizes under 100KB
- Use consistent art style
- Match rarity colors when possible
- Test images in Discord before finalizing
