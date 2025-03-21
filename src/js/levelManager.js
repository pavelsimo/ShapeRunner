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
     * @returns {string} The combined ASCII level layout
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
        
        // Randomly select middle titles
        const selectedTitles = [];
        for (let i = 0; i < sectionCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableTitles.length);
            selectedTitles.push(availableTitles[randomIndex]);
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
        
        return levelString;
    }
} 