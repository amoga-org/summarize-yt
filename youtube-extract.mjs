import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extracts transcript text from YouTube transcript JSON
 * @param {Object} jsonData - The parsed JSON data
 * @returns {string[]} Array of transcript lines
 */
function extractTranscriptText(jsonData) {
    try {
        const segments =
            jsonData?.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer?.content
                ?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments;

        if (!segments || !Array.isArray(segments)) {
            throw new Error("No valid transcript segments found in the JSON structure");
        }

        return segments
            .map((segment) => segment?.transcriptSegmentRenderer?.snippet?.runs?.[0]?.text)
            .filter((text) => text != null && text !== "");
    } catch (error) {
        console.error("Error extracting transcript:", error.message);
        return [];
    }
}

/**
 * Processes a transcript JSON file and saves the extracted text
 * @param {string} inputPath - Path to the input JSON file
 * @param {string} outputPath - Path where the transcript will be saved
 * @returns {Promise<boolean>} - Success status
 */
async function processTranscript(inputPath, outputPath) {
    try {
        // Resolve paths
        const resolvedInputPath = path.resolve(inputPath);
        const resolvedOutputPath = path.resolve(outputPath);

        // Check if input file exists
        if (!fs.existsSync(resolvedInputPath)) {
            throw new Error(`Input file not found: ${resolvedInputPath}`);
        }

        // Read and parse input file
        console.log(`Reading file: ${resolvedInputPath}`);
        const fileContent = fs.readFileSync(resolvedInputPath, "utf8");

        let jsonData;
        try {
            jsonData = JSON.parse(fileContent);
        } catch (parseError) {
            throw new Error(`Failed to parse JSON: ${parseError.message}`);
        }

        // Extract transcript text
        const transcriptLines = extractTranscriptText(jsonData);

        if (transcriptLines.length === 0) {
            throw new Error("No transcript lines were extracted");
        }

        // Ensure output directory exists
        const outputDir = path.dirname(resolvedOutputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write transcript to file
        const transcriptText = transcriptLines.join("\n");
        fs.writeFileSync(resolvedOutputPath, transcriptText, "utf8");

        console.log(`Successfully extracted ${transcriptLines.length} lines`);
        console.log(`Transcript saved to: ${resolvedOutputPath}`);

        return true;
    } catch (error) {
        console.error("Error processing transcript:", error.message);
        return false;
    }
}

/**
 * Main execution function
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length !== 2) {
        console.log("Usage: node transcript-extractor.js <input-json-file> <output-txt-file>");
        console.log("Example: node transcript-extractor.js input.json transcript.txt");
        process.exit(1);
    }

    const [inputFile, outputFile] = args;
    const success = await processTranscript(inputFile, outputFile);

    process.exit(success ? 0 : 1);
}

// Run the script if it's being executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}

// Export for use as a module
export { processTranscript, extractTranscriptText };
