/**
 * LevelManager class - Manages tile-based level loading and composition
 * Loads level titles from JSON files and combines them to create full levels
 */
export class LevelManager {
    constructor() {
        this.levelTitles = {};
        this.currentLevel = 1;
        this.portalPlaced = false;
        this.startPlaced = false;
        this.previousTitles = [];
        
        // Cache for the parsed JSON files
        this.levelCache = {};
    }
    
    /**
     * Initialize the LevelManager by loading all level title files
     * @returns {Promise} A promise that resolves when all level titles are loaded
     */
    async initialize() {
        try {
            // Load all level title files
            const titles = [
                'title1', 'title2', 'title3', 'title4', 'title5', 
                'title6', 'title7', 'title8', 'title9', 'title10', 
                'title11', 'title12', 'title13', 'title14', 'title15',
                'start', 'end'
            ];
            
            // Load each title JSON file
            for (const title of titles) {
                await this.loadLevelTitle(title);
            }
            
            console.log('All level titles loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize LevelManager:', error);
            return false;
        }
    }
    
    /**
     * Load a level title from a JSON file
     * @param {string} titleId - The ID of the title to load
     * @returns {Promise} A promise that resolves when the title is loaded
     */
    async loadLevelTitle(titleId) {
        try {
            // If already cached, return from cache
            if (this.levelCache[titleId]) {
                this.levelTitles[titleId] = this.levelCache[titleId];
                return this.levelCache[titleId];
            }
            
            // Fetch the JSON file
            const response = await fetch(`levels/${titleId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load level title: ${titleId}`);
            }
            
            const data = await response.json();
            this.levelTitles[titleId] = data;
            this.levelCache[titleId] = data;
            
            console.log(`Loaded level title: ${data.title}`);
            return data;
        } catch (error) {
            console.error(`Error loading level title ${titleId}:`, error);
            
            // Use fallback data in case of error
            const fallbackData = this.createFallbackLevel(titleId);
            this.levelTitles[titleId] = fallbackData;
            this.levelCache[titleId] = fallbackData;
            
            return fallbackData;
        }
    }
    
    /**
     * Create a fallback level in case a JSON file fails to load
     * @param {string} titleId - The ID of the title that failed to load
     * @returns {Object} A simple fallback level
     */
    createFallbackLevel(titleId) {
        return {
            title: `Fallback ${titleId}`,
            description: "Emergency fallback level",
            width: 10,
            height: 5,
            layout: [
                "...........",
                "...........",
                "....C......",
                "...BBB.....",
                "...........",
            ]
        };
    }
    
    /**
     * Generate a complete level by combining multiple level titles
     * @param {number} levelNumber - The level number to generate
     * @param {number} difficulty - Difficulty level (1-5)
     * @returns {Object} The combined level layout and theme
     */
    generateLevel(levelNumber, difficulty = 1) {
        this.currentLevel = levelNumber;
        this.portalPlaced = false;
        this.startPlaced = false;
        
        // Always start with the 'start' title
        const startTitle = this.levelTitles['start'];
        
        // Always end with the 'end' title
        const endTitle = this.levelTitles['end'];
        
        // Get available middle titles (excluding start and end)
        const availableTitles = Object.keys(this.levelTitles)
            .filter(id => id !== 'start' && id !== 'end')
            .map(id => this.levelTitles[id]);
        
        // Determine how many middle sections to include based on difficulty
        // Higher difficulty = more sections
        const sectionCount = 2 + Math.min(Math.floor(difficulty * 0.8), 4);
        
        // Randomly select middle titles, ensuring we don't reuse too many from the previous level
        const selectedTitles = [];
        const availableTitlesCopy = [...availableTitles]; // Create a copy to modify
        
        // Filter out most of the previously used titles to ensure variety
        const titlesToAvoid = this.previousTitles.slice(0, Math.floor(this.previousTitles.length * 0.7));
        const filteredTitles = availableTitlesCopy.filter(title => 
            !titlesToAvoid.some(prevTitle => 
                prevTitle.title === title.title
            )
        );
        
        // Use the filtered titles if we have enough, otherwise use all available titles
        const titlePool = filteredTitles.length >= sectionCount ? filteredTitles : availableTitlesCopy;
        
        // Select titles for this level
        for (let i = 0; i < sectionCount; i++) {
            if (titlePool.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * titlePool.length);
            const selectedTitle = titlePool.splice(randomIndex, 1)[0];
            selectedTitles.push(selectedTitle);
        }
        
        // Remember these titles for next time
        this.previousTitles = [...selectedTitles];
        
        // MODIFIED: Theme selection - Make theme part of the level instead of the title
        // Get all available themes from title files
        const availableThemes = []; 
        for (const title of [startTitle, ...availableTitles, endTitle]) {
            if (title.theme) {
                availableThemes.push(title.theme);
            }
        }
        
        // Select a theme based on level number to ensure consistency within a level
        let theme = null;
        if (availableThemes.length > 0) {
            // Use a consistent theme index for the same level number
            const themeIndex = (levelNumber - 1) % availableThemes.length;
            theme = availableThemes[themeIndex];
        }
        
        // If no theme was found, use a default theme
        if (!theme) {
            theme = {
                background: "#000000",
                platforms: "#0088ff",
                player: "#ff4500",
                accent: "#00ff88"
            };
        }
        
        // Build the complete level by combining titles horizontally
        // Each level title is a 2D array of ASCII characters
        
        // Start with a base set of empty rows
        const maxHeight = Math.max(
            startTitle.height,
            endTitle.height,
            ...selectedTitles.map(title => title.height)
        );
        
        // Initialize the combined level with empty rows
        const combinedLevel = [];
        for (let i = 0; i < maxHeight; i++) {
            combinedLevel.push([]);
        }
        
        // Function to append a title's layout to the combined level
        const appendTitle = (title) => {
            const layout = title.layout;
            
            // For each row in the title's layout
            for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
                // Get the row string and convert to array of characters
                const rowChars = layout[rowIndex].split('');
                
                // Append these characters to the corresponding row in the combined level
                const combinedRowIndex = maxHeight - layout.length + rowIndex;
                if (combinedRowIndex >= 0) {
                    combinedLevel[combinedRowIndex] = combinedLevel[combinedRowIndex].concat(rowChars);
                }
            }
        };
        
        // Append titles in order: start, middle sections, end
        appendTitle(startTitle);
        selectedTitles.forEach(title => appendTitle(title));
        appendTitle(endTitle);
        
        // Convert the 2D array back to a string format
        const levelString = combinedLevel.map(row => row.join('')).join('\n');
        
        return {
            level: levelString,
            theme: theme
        };
    }
} 