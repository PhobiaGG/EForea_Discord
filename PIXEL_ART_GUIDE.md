# Adding Pixel Art Assets to Items

This guide explains how to add custom pixel art images to items in your Discord RPG bot.

## Overview

Items can display custom images in Discord embeds by adding an `image` field to the item data. Images can be:
- **Local files** - Stored in the `assets/items/` directory
- **URLs** - Hosted online (Discord CDN, Imgur, etc.)

## Quick Start

### 1. Create Your Pixel Art

**Recommended Specifications:**
- **Size**: 32x32, 64x64, or 128x128 pixels
- **Format**: PNG (with transparency support)
- **Style**: Pixel art, retro-game aesthetic
- **Color Depth**: 8-bit or 16-bit color palettes work well

**Tools for Creating Pixel Art:**
- **Aseprite** ($20) - Professional pixel art tool
- **Piskel** (Free, web-based) - https://www.piskelapp.com/
- **GIMP** (Free) - Use pencil tool with a small brush
- **Photoshop** - Disable anti-aliasing, use pencil tool
- **GraphicsGale** (Free)

### 2. Save Your Image

**Option A: Local File (Recommended for small bots)**
1. Save your image to `assets/items/` directory
2. Name it with the item ID: `wooden_sword.png`
3. Keep file sizes small (< 100KB)

**Option B: URL Hosting (Recommended for larger bots)**
1. Upload to an image host (Discord CDN, Imgur, GitHub, etc.)
2. Get the direct image URL
3. Use the URL in your item data

### 3. Add Image to Item Data

Edit `data/items.json` and add the `image` field:

```json
{
  "weapons": {
    "wooden_sword": {
      "id": "wooden_sword",
      "name": "Wooden Sword",
      "type": "weapon",
      "slot": "WeaponSlotOne",
      "rarity": "common",
      "level": 1,
      "price": 50,
      "stats": {
        "Strength": 5,
        "AtkSpeed": 0.1
      },
      "description": "A basic wooden sword. Better than nothing.",
      "image": "assets/items/wooden_sword.png"
    }
  }
}
```

**For URLs:**
```json
"image": "https://i.imgur.com/abc123.png"
```

## Image Display Locations

Images will automatically appear in:
- `/profile` - Shows equipped item images
- `/inventory` - Shows item thumbnails when viewing inventory
- `/shop` - Shows items for sale with images
- `/buy` - Confirmation message shows purchased item
- `/battle` - Victory screen shows looted items

## Best Practices

### File Naming
- Use lowercase
- Use underscores instead of spaces
- Match the item ID exactly
- Example: `iron_helmet.png` for item ID `iron_helmet`

### Image Optimization
- Keep file sizes under 100KB
- Use PNG for transparency
- Optimize with tools like:
  - TinyPNG (https://tinypng.com/)
  - ImageOptim (Mac)
  - PNGGauntlet (Windows)

### Consistent Style
- Keep art style consistent across all items
- Use same resolution for all items
- Use similar color palettes
- Consider creating item "sets" that look related

### Discord Embed Limits
- Embeds can display one thumbnail (small, top-right)
- Embeds can display one main image (large, bottom)
- File attachments must be < 8MB (usually not an issue for pixel art)

## Example Workflow

### Creating a Sword Icon

1. **Open Piskel** (or your chosen tool)
2. **Set canvas size** to 64x64 pixels
3. **Draw your sword**:
   ```
   - Start with blade outline (gray/silver)
   - Add highlights (white)
   - Add shadows (dark gray)
   - Draw handle (brown)
   - Add guard (gold/yellow)
   ```
4. **Export as PNG**
5. **Save to** `assets/items/wooden_sword.png`
6. **Add to items.json**:
   ```json
   "image": "assets/items/wooden_sword.png"
   ```
7. **Restart bot** to load new images
8. **Test with** `/shop` or `/buy wooden_sword`

## Hosting Options

### Local Files (Default)
- ✅ Free
- ✅ Full control
- ✅ No external dependencies
- ⚠️ Increases bot memory usage
- ⚠️ Files must be included with bot

### Discord CDN
- ✅ Fast and reliable
- ✅ Free for Discord users
- ⚠️ Upload to a Discord channel
- ⚠️ Get direct link (right-click → Copy Image Address)

**Example:**
```json
"image": "https://cdn.discordapp.com/attachments/1234567890/image.png"
```

### Imgur
- ✅ Free for non-commercial use
- ✅ No account needed
- ✅ Direct links available
- ⚠️ May compress images

**How to use:**
1. Upload to Imgur
2. Right-click image → "Copy image address"
3. Use URL in items.json

### GitHub Repository
- ✅ Version controlled with your code
- ✅ Free and reliable
- ✅ Good for open source projects

**Example:**
```json
"image": "https://raw.githubusercontent.com/YourUser/YourRepo/main/assets/items/sword.png"
```

### Self-Hosted Web Server
- ✅ Full control
- ✅ Custom domain
- ⚠️ Requires web hosting
- ⚠️ Costs money

## Bulk Asset Creation

### Creating Multiple Items at Once

1. **Create a sprite sheet** with all items
2. **Export individual items** using tools like:
   - Aseprite's slice feature
   - Photoshop's export layers
   - Python/ImageMagick scripts

3. **Batch rename** files to match item IDs
   ```bash
   # Example bash script
   for file in *.png; do
     mv "$file" "$(echo $file | tr '[:upper:]' '[:lower:]' | tr ' ' '_')"
   done
   ```

4. **Generate JSON entries** with a script:
   ```javascript
   // generate-image-fields.js
   const fs = require('fs');
   const itemsDir = './assets/items/';

   fs.readdirSync(itemsDir).forEach(file => {
     if (file.endsWith('.png')) {
       const itemId = file.replace('.png', '');
       console.log(`"image": "assets/items/${file}",`);
     }
   });
   ```

## Troubleshooting

### Image Not Showing

**Check:**
1. File path is correct (case-sensitive!)
2. File exists in `assets/items/`
3. File is readable (check permissions)
4. URL is publicly accessible
5. Image format is PNG/JPG/GIF
6. Bot has been restarted after adding image

**Common Issues:**
```
❌ "image": "assets/items/Wooden_Sword.png"  // Wrong case
✅ "image": "assets/items/wooden_sword.png"  // Correct

❌ "image": "wooden_sword.png"  // Missing path
✅ "image": "assets/items/wooden_sword.png"  // Correct
```

### Image Too Large

Discord limits:
- Embed images: 8MB max
- Optimal: < 100KB for fast loading

**Solution:**
1. Use online compression: TinyPNG, Compressor.io
2. Reduce resolution (128x128 → 64x64)
3. Reduce color depth (256 colors max)

### Performance Issues

If bot is slow with many images:
- Switch to URLs instead of local files
- Implement image caching
- Use Discord CDN for hosting
- Reduce image file sizes

## Advanced: Animated Items

Discord supports GIF animations in embeds!

**Steps:**
1. Create animated GIF (Aseprite, Piskel, etc.)
2. Keep frame count low (4-8 frames)
3. Keep file size small (< 100KB)
4. Save to `assets/items/magical_sword.gif`
5. Add to items.json

```json
"image": "assets/items/magical_sword.gif"
```

**Best for:**
- Legendary items
- Magical effects
- Special event items

## Color Palette Suggestions

### Rarity Colors
Use these color schemes for different item rarities:

**Common (Gray/White):**
- `#9E9E9E`, `#BDBDBD`, `#E0E0E0`

**Uncommon (Green):**
- `#4CAF50`, `#66BB6A`, `#81C784`

**Rare (Blue):**
- `#2196F3`, `#42A5F5`, `#64B5F6`

**Epic (Purple):**
- `#9C27B0`, `#AB47BC`, `#BA68C8`

**Legendary (Orange/Gold):**
- `#FF9800`, `#FFA726`, `#FFB74D`
- Gold accents: `#FFD700`, `#FFC107`

## Templates

### Blank Canvas Templates

Download or create these blank templates:

**32x32 Template:**
- Good for: Icons, consumables, materials
- Style: Retro, NES-era

**64x64 Template:**
- Good for: Weapons, armor, accessories
- Style: Modern pixel art

**128x128 Template:**
- Good for: Legendary items, bosses, characters
- Style: High-detail pixel art

## Community Resources

### Free Pixel Art Assets
- **OpenGameArt.org** - Free game assets
- **itch.io** - Indie game assets (many free)
- **Kenney.nl** - Free game assets
- **Pixabay** - Free images (some pixel art)

### License Considerations
- Ensure you have rights to use assets
- Credit creators when required
- Commercial use may require licenses
- Consider creating original art

## Need Help?

If you're having trouble adding images:
1. Check file paths and naming
2. Verify image formats (PNG recommended)
3. Test with a single item first
4. Check bot console for errors
5. Ensure bot has file read permissions

---

**Happy pixel art creating!** 🎨
