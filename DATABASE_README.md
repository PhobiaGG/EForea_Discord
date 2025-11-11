# DatabaseManager - Simple JSON Database for Discord RPG

A lightweight, file-based JSON database manager for Discord RPG bots. No external database software required!

## Features

- **In-Memory Cache**: All operations happen in memory for blazing-fast performance
- **Auto-Save**: Periodic saves to prevent data loss
- **Graceful Shutdown**: Ensures data is saved before the bot exits
- **Atomic Writes**: Uses temporary files to prevent data corruption
- **Auto-Provisioning**: Automatically creates new player profiles when needed
- **Simple API**: Easy-to-use methods for common operations

## Quick Start

### 1. Import and Initialize

```javascript
const DatabaseManager = require('./DatabaseManager');
const db = new DatabaseManager('./database.json');
```

### 2. Set Up Auto-Save (Every 5 minutes)

```javascript
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

setInterval(async () => {
    console.log('Auto-saving database...');
    await db.save();
}, AUTO_SAVE_INTERVAL);
```

### 3. Set Up Graceful Shutdown

```javascript
const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Saving database...`);
    db.saveSync(); // Synchronous save for shutdown
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
```

### 4. Use in Your Discord Bot

```javascript
// Get a player's profile (creates new profile if doesn't exist)
const profile = db.getProfile(userId);

// Modify the profile
profile.Currency.Copper += 100;
profile.PlrStats.Level = 5;

// Update the profile in the database
db.updateProfile(userId, profile);

// Manually save (optional - auto-save handles this)
await db.save();
```

## API Reference

### Constructor

```javascript
new DatabaseManager(dbFilePath = './database.json')
```

Creates a new DatabaseManager instance and loads data from the specified file.

### Methods

#### `getProfile(userId)`

Gets a player's profile. If the player doesn't exist, automatically creates a new profile using the PlayerDataTemplate.

```javascript
const profile = db.getProfile('123456789012345678');
console.log(profile.PlrStats.Level); // 1 (for new players)
```

**Returns:** Player profile object

#### `updateProfile(userId, profileData)`

Updates a player's profile in the cache.

```javascript
const profile = db.getProfile(userId);
profile.Currency.Copper += 500;
db.updateProfile(userId, profile);
```

#### `save()` (async)

Saves the entire in-memory cache to the database file. Uses atomic writes to prevent corruption.

```javascript
await db.save();
```

**Returns:** Promise<boolean> - true if successful

#### `saveSync()`

Synchronous version of save(), used for shutdown hooks.

```javascript
db.saveSync();
```

**Returns:** boolean - true if successful

#### `hasProfile(userId)`

Checks if a player profile exists.

```javascript
if (db.hasProfile(userId)) {
    console.log('Player exists!');
}
```

**Returns:** boolean

#### `deleteProfile(userId)`

Deletes a player profile from the cache.

```javascript
db.deleteProfile(userId);
```

**Returns:** boolean - true if deleted

#### `getAllProfiles()`

Gets all player profiles as a Map.

```javascript
const allProfiles = db.getAllProfiles();
for (const [userId, profile] of allProfiles) {
    console.log(`${userId}: Level ${profile.PlrStats.Level}`);
}
```

**Returns:** Map<string, Object>

#### `getProfileCount()`

Gets the number of player profiles.

```javascript
console.log(`Total players: ${db.getProfileCount()}`);
```

**Returns:** number

## Player Data Structure

Each player profile contains the following structure:

```javascript
{
    PlrStats: {
        Level: 1,
        Mana: 100,
        BaseHealth: 100,
        Resistence: 0,
        Strength: 0,
        Wisdom: 100,
        CritDmg: 0,
        CritChance: 2,
        AtkSpeed: 1,
        HealthRegen: 2,
        Vitality: 1,
        Speed: 100,
        Fortune: 1,
        MiningSpeed: 1,
        BreakingPower: 1
    },
    Exp: {
        CombatExp: 0,
        MiningExp: 0,
        ForagingExp: 0,
        FishingExp: 0,
        DungeoneeringExp: 0,
        TamingExp: 0,
        ReforgeExp: 0
    },
    Currency: {
        Copper: 100,
        Silver: 0,
        Gold: 0,
        Platinum: 0
    },
    Character: {
        Face: 1,
        Hair: 1,
        HairColor: 1,
        SkinTone: 1,
        ShirtColor: 1,
        PantsColor: 1
    },
    EquippedItems: {
        Gauntlets: "",
        Chestplate: "",
        Greaves: "",
        Helmet: "",
        WeaponSlotOne: "",
        WeaponSlotTwo: "",
        AccessoryOne: "",
        AccessoryTwo: ""
    },
    Inventory: {},
    Settings: {
        MusicEnabled: true,
        TipsEnabled: true
    },
    JoinTimestamp: 1234567890123
}
```

## Discord.js Integration Example

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const DatabaseManager = require('./DatabaseManager');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const db = new DatabaseManager('./database.json');

// Set up auto-save
setInterval(async () => {
    await db.save();
}, 5 * 60 * 1000);

// Set up graceful shutdown
process.on('SIGINT', () => {
    db.saveSync();
    process.exit(0);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const profile = db.getProfile(interaction.user.id);

    if (interaction.commandName === 'balance') {
        await interaction.reply(
            `**Your Balance:**\n` +
            `🪙 Copper: ${profile.Currency.Copper}\n` +
            `🥈 Silver: ${profile.Currency.Silver}\n` +
            `🥇 Gold: ${profile.Currency.Gold}\n` +
            `💎 Platinum: ${profile.Currency.Platinum}`
        );
    }

    if (interaction.commandName === 'stats') {
        await interaction.reply(
            `**Level ${profile.PlrStats.Level} Player**\n` +
            `❤️ Health: ${profile.PlrStats.BaseHealth}\n` +
            `⚔️ Strength: ${profile.PlrStats.Strength}\n` +
            `🔮 Wisdom: ${profile.PlrStats.Wisdom}\n` +
            `⚡ Speed: ${profile.PlrStats.Speed}`
        );
    }

    if (interaction.commandName === 'daily') {
        profile.Currency.Copper += 100;
        profile.Currency.Silver += 1;
        db.updateProfile(interaction.user.id, profile);

        await interaction.reply('Daily reward claimed! +100 Copper, +1 Silver 🎁');
    }
});

client.login(process.env.DISCORD_TOKEN);
```

## Best Practices

### 1. Always Update After Modifying

```javascript
// ✅ CORRECT
const profile = db.getProfile(userId);
profile.Currency.Copper += 100;
db.updateProfile(userId, profile); // Update after modification

// ❌ WRONG - Changes are already in cache, but good practice to call updateProfile
const profile = db.getProfile(userId);
profile.Currency.Copper += 100;
// Missing updateProfile - still works but inconsistent
```

### 2. Don't Modify References

The profile returned by `getProfile()` is a reference to the in-memory object. While you can modify it directly, it's better practice to call `updateProfile()` for consistency.

### 3. Save Frequency

- Too frequent: Wastes I/O resources
- Too infrequent: Risk of data loss
- **Recommended**: 5-10 minutes for most bots

### 4. Manual Saves

Consider manual saves after critical operations:

```javascript
// After important transaction
profile.Currency.Gold += 1000;
db.updateProfile(userId, profile);
await db.save(); // Save immediately
```

## Performance Considerations

- **Memory Usage**: The entire database is loaded into memory. For 10,000 players with the default template, expect ~50-100MB RAM usage.
- **Save Time**: Saving 10,000 profiles takes approximately 100-500ms depending on disk speed.
- **Scalability**: Recommended for bots with up to 50,000 players. Beyond that, consider a proper database like PostgreSQL or MongoDB.

## File Safety

The `save()` method uses atomic writes:

1. Writes data to `database.json.tmp`
2. Renames `database.json.tmp` to `database.json`

This prevents corruption if the process crashes during save.

## Testing

Run the included example:

```bash
node example.js
```

Press Ctrl+C to test graceful shutdown.

## Troubleshooting

### Database not saving?

- Check file permissions
- Ensure the directory exists
- Check disk space
- Look for error messages in console

### Lost data after crash?

- Ensure graceful shutdown hooks are set up
- Consider more frequent auto-saves
- Check if `database.json.tmp` exists (incomplete save)

### High memory usage?

- The entire database is in memory
- Consider archiving inactive players
- For large databases (>100k players), use a proper database

## License

This code is provided as-is for use in your Discord RPG bot project.
