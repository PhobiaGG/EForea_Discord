# EForea Discord RPG

A feature-rich, text-based RPG bot for Discord with combat, gathering, crafting, and progression systems. No external database required - uses a simple JSON file for data persistence!

## Features

### ⚔️ Combat System
- Turn-based combat with 8+ unique enemies
- Damage calculation with strength, resistance, and critical hits
- Dynamic turn order based on speed stats
- Experience and loot rewards
- Level-up system with stat progression

### 🎒 Inventory & Equipment
- Full inventory management system
- Equipment system with 8 equipment slots
- Item rarity system (Common → Legendary)
- Stat bonuses from equipped items
- Stackable items (consumables, materials)
- Unique items (weapons, armor, accessories)

### 💰 Economy System
- Four-tier currency (Copper, Silver, Gold, Platinum)
- Multiple shops (General Store, Blacksmith, Magic Shop, Rare Merchant)
- Buy/sell system
- Daily login rewards
- Loot drops from combat

### ⛏️ Gathering Skills
- Mining system with cooldowns
- Experience progression for gathering skills
- Fortune stat affects drop rates
- Tool requirements and bonuses

### 📊 Progression System
- Combat level with stat increases
- Skill levels (Mining, Foraging, Fishing, etc.)
- Experience tracking for multiple skills
- Equipment level requirements

### 🎨 Pixel Art Support
- Display custom pixel art for all items
- Support for local files or URLs
- Automatic display in embeds (shop, inventory, profile)
- Easy to add your own custom artwork
- See [PIXEL_ART_GUIDE.md](PIXEL_ART_GUIDE.md) for details

## Quick Start

### Prerequisites
- Node.js 16.11.0 or higher
- A Discord Bot Token ([Create one here](https://discord.com/developers/applications))

### Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your bot credentials:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_application_id_here
   GUILD_ID=your_test_server_id_here
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

### Getting Bot Credentials

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application (or select an existing one)
3. Go to the "Bot" section and click "Reset Token" to get your `DISCORD_TOKEN`
4. Copy the Application ID from the "General Information" section for `CLIENT_ID`
5. Right-click your Discord server icon and select "Copy Server ID" for `GUILD_ID` (requires Developer Mode)

### Inviting the Bot

Use this URL template (replace `YOUR_CLIENT_ID` with your actual client ID):
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147485696&scope=bot%20applications.commands
```

## Available Commands

### 👤 Profile & Info
- `/profile [@user]` - View player stats and equipment
- `/balance [@user]` - Check currency balance
- `/inventory [filter]` - View your items
- `/help` - Display command list

### ⚔️ Combat
- `/battle <enemy>` - Fight an enemy
- `/enemies` - List all enemies with stats and rewards

### 🛒 Shopping
- `/shop <name>` - Browse a shop
- `/buy <item> [quantity]` - Purchase an item (use name or ID, e.g. "Wooden Sword")
- `/daily` - Claim daily login rewards

### ⚔️ Equipment
- `/equip <item>` - Equip an item
- `/unequip <slot>` - Unequip from a slot

### ⛏️ Gathering
- `/mine` - Mine for ores and minerals (30s cooldown)

## Game Mechanics

### Combat
Combat is turn-based with turn order determined by Speed stats:
1. Higher speed attacks first
2. Damage = Strength × (1 + AtkSpeed modifier) - Resistance reduction
3. Critical hits multiply damage by (1 + CritDmg%)
4. Victory grants XP, currency, and possible item drops

### Leveling
- Gain Combat XP from battles
- Level up to increase stats (Health, Mana, Strength, etc.)
- XP required = 100 × level² + 50 × level
- Skill XP gained from gathering activities

### Equipment System
- 8 equipment slots: Helmet, Chestplate, Greaves, Gauntlets, 2 Weapons, 2 Accessories
- Each item provides stat bonuses
- Level requirements for higher-tier items
- Rarity affects item power

### Currency System
- **Copper**: Base currency
- **Silver**: 100 Copper = 1 Silver
- **Gold**: 100 Silver = 1 Gold
- **Platinum**: 100 Gold = 1 Platinum
- Currency automatically converts to higher denominations

### Gathering
- Cooldown-based activities (30 seconds for mining)
- Fortune stat increases drop chances
- Tool requirements for optimal results
- Gain skill-specific experience

## Project Structure

```
EForea_Discord/
├── bot.js                      # Main bot entry point
├── DatabaseManager.js          # JSON database manager
├── package.json                # Dependencies
├── .env                        # Bot credentials (create from .env.example)
├── database.json               # Player data (auto-generated)
│
├── commands/                   # Slash commands
│   ├── profile.js              # View player profile
│   ├── balance.js              # Check currency
│   ├── inventory.js            # View inventory
│   ├── battle.js               # Combat system
│   ├── enemies.js              # List enemies
│   ├── shop.js                 # Browse shops
│   ├── buy.js                  # Purchase items
│   ├── equip.js                # Equip items
│   ├── unequip.js              # Unequip items
│   ├── daily.js                # Daily rewards
│   ├── mine.js                 # Mining command
│   └── help.js                 # Help menu
│
├── systems/                    # Game systems
│   ├── combat.js               # Combat logic
│   ├── items.js                # Item & inventory management
│   └── leveling.js             # XP and level progression
│
└── data/                       # Game data (JSON)
    ├── items.json              # All items (weapons, armor, etc.)
    ├── enemies.json            # Enemy stats and rewards
    └── shops.json              # Shop inventories
```

## Customization

### Adding New Items
Edit `data/items.json` and add your item to the appropriate category:
```json
"my_sword": {
  "id": "my_sword",
  "name": "My Custom Sword",
  "type": "weapon",
  "slot": "WeaponSlotOne",
  "rarity": "rare",
  "level": 10,
  "price": 500,
  "stats": {
    "Strength": 30,
    "CritChance": 5
  },
  "description": "A custom sword!",
  "image": "assets/items/my_sword.png"
}
```

### Adding Pixel Art to Items

1. Create your pixel art (recommended 64x64 PNG)
2. Save to `assets/items/` with the item ID as filename
3. Add `"image": "assets/items/item_id.png"` to the item in items.json
4. Or use a URL: `"image": "https://i.imgur.com/yourimage.png"`

Items with images will automatically display them in:
- Shop listings
- Purchase confirmations
- Inventory views
- Profile equipment

**See [PIXEL_ART_GUIDE.md](PIXEL_ART_GUIDE.md) for detailed instructions on creating and adding pixel art.**

### Adding New Enemies
Edit `data/enemies.json`:
```json
"my_boss": {
  "id": "my_boss",
  "name": "My Boss",
  "level": 25,
  "health": 1000,
  "stats": {
    "Strength": 50,
    "Resistence": 30,
    "Speed": 120
  },
  "rewards": {
    "exp": 500,
    "copper": [500, 1000],
    "gold": [5, 10]
  },
  "loot": [
    { "item": "my_sword", "chance": 0.1 }
  ],
  "description": "An epic boss fight!"
}
```

### Adding to Shops
Edit `data/shops.json` and add items to the shop's inventory:
```json
"my_shop": {
  "name": "My Shop",
  "description": "A custom shop!",
  "items": [
    { "item": "my_sword", "stock": 5 },
    { "item": "health_potion", "stock": -1 }
  ]
}
```

## Database Management

The bot uses a JSON file (`database.json`) for data persistence:
- **Auto-save**: Database saves every 5 minutes
- **Graceful shutdown**: Saves on Ctrl+C or process termination
- **Atomic writes**: Prevents corruption during saves
- **Backups**: Consider backing up `database.json` regularly

### Backup Command
```bash
cp database.json database.backup.json
```

## Troubleshooting

### Bot doesn't respond
- Check that the bot has permission to use slash commands
- Verify `DISCORD_TOKEN` is correct in `.env`
- Make sure the bot is invited with the correct permissions

### Commands not showing up
- Wait a few minutes for global commands to register
- Use `GUILD_ID` for instant command registration during development
- Check the bot has `applications.commands` scope

### Database errors
- Ensure the bot has write permissions in the directory
- Check `database.json` is valid JSON
- Look for error messages in the console

### Out of memory
- The entire database loads into memory
- For 10,000+ players, consider implementing MongoDB or PostgreSQL
- Current system is optimized for small-to-medium servers

## Performance

- **Memory Usage**: ~50-100MB for 10,000 players
- **Save Time**: ~100-500ms for 10,000 profiles
- **Recommended**: Up to 50,000 players
- **Scalability**: For larger bots, migrate to a proper database

## Future Features

- [ ] Dungeon system with multi-room encounters
- [ ] Crafting and reforging
- [ ] Pet/taming system
- [ ] Guilds and parties
- [ ] PvP combat
- [ ] Leaderboards
- [ ] Seasonal events
- [ ] Achievement system
- [ ] Quest system
- [ ] Trading between players

## Contributing

Feel free to fork and modify this bot for your own server! If you add cool features, consider sharing them.

## License

MIT License - Feel free to use and modify as needed.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code comments for implementation details
3. Test commands with `/help` in Discord

---

**Enjoy your Discord RPG adventure!** ⚔️🎮
