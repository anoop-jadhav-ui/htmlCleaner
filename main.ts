import { DOMParser, Element } from 'jsr:@b-fuze/deno-dom'

function cleanHTML(html: string): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    if (!doc) return html

    // Remove class and id attributes from all elements
    doc.querySelectorAll('[class], [id]').forEach((element: Element) => {
        element.removeAttribute('class')
        element.removeAttribute('id')
    })

    return doc.documentElement?.outerHTML || html
}

// Function to process a single file
async function processFile(inputFile: string, outputFile: string) {
    try {
        const inputContent = await Deno.readTextFile(inputFile)
        const cleanedHTML = cleanHTML(inputContent)
        await Deno.writeTextFile(outputFile, cleanedHTML)
        console.log(`Processed: ${inputFile} -> ${outputFile}`)
    } catch (err) {
        console.error(`Failed to process ${inputFile}:`, (err as Error).message)
    }
}

// Function to handle directory input using Deno.readDir
async function processDirectory(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
        if (entry.isFile && entry.name.endsWith('.html')) {
            const inputFilePath = `${dir}/${entry.name}`
            const outputFilePath = `${dir}/${entry.name.replace('.html', '_processed.html')}`
            await processFile(inputFilePath, outputFilePath)
        }
    }
}

async function main() {
    const args = Deno.args

    if (args.length < 1) {
        console.error(
            'Usage: cleanup-html <inputFile.html|directory> [outputFile.html]'
        )
        Deno.exit(1)
    }

    const inputPath = args[0]

    try {
        const fileInfo = await Deno.stat(inputPath)

        if (fileInfo.isFile) {
            // If output file is not specified, add `_processed` to the input filename
            const outputFile =
                args[1] || inputPath.replace('.html', '_processed.html')
            await processFile(inputPath, outputFile)
        } else if (fileInfo.isDirectory) {
            // Process all .html files in the directory
            await processDirectory(inputPath)
        } else {
            console.error('Invalid input path. Must be a file or directory.')
            Deno.exit(1)
        }
    } catch (err) {
        console.error('Error accessing input path:', (err as Error).message)
        Deno.exit(1)
    }
}

// Run the main function
if (import.meta.main) {
    main()
}
