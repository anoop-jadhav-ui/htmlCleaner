import { DOMParser, Element } from 'jsr:@b-fuze/deno-dom'

// Helper function to clean up URLs in href attributes
function cleanURL(url: string): string {
    const match = url.match(/https:\/\/www\.google\.com\/url\?q=([^&]*)/)
    if (match) {
        // Decode the extracted URL and return it
        return decodeURIComponent(match[1])
    }
    return url // Return the original URL if it's not a Google redirect URL
}

// Function to clean up unwanted elements (classes, IDs, CSS, meta tags, empty tags, and spaces/newlines)
function cleanHTML(html: string): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    if (!doc) return html

    // Remove class and id attributes from all elements
    doc.querySelectorAll('[class], [id]').forEach((element: Element) => {
        element.removeAttribute('class')
        element.removeAttribute('id')
    })

    // Remove all <style>, <meta>, <title>, and <head> tags
    doc.querySelectorAll('style, meta, title, head').forEach(
        (element: Element) => {
            element.remove()
        }
    )

    // Clean up href attributes containing Google redirect URLs
    doc.querySelectorAll('[href]').forEach((element: Element) => {
        const href = element.getAttribute('href')
        if (href) {
            element.setAttribute('href', cleanURL(href))
        }
    })

    // Recursively clean up empty elements using a depth-first traversal
    function removeEmptyElements(node: Element) {
        const children = Array.from(node.children)

        // First remove children recursively
        children.forEach(removeEmptyElements)

        // Remove the node if it's empty (no text and no children)
        if (!node.textContent?.trim() && !node.children.length) {
            node.remove()
        }
    }

    // Start from the body and clean up the whole document
    if (doc.body) {
        removeEmptyElements(doc.body)
    }

    // Serialize the cleaned document back to HTML
    let cleanedHTML = doc.body?.innerHTML || ''

    // Remove all newlines, tabs, and excessive spaces between tags
    cleanedHTML = cleanedHTML.replace(/>\s+</g, '><') // Remove spaces between tags
    cleanedHTML = cleanedHTML.replace(/\n/g, '') // Remove newline characters
    cleanedHTML = cleanedHTML.replace(/\s{2,}/g, ' ') // Replace multiple spaces with a single space

    return cleanedHTML
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

// Main CLI function
async function main() {
    const args = Deno.args

    if (args.length < 1) {
        console.error(
            `
            Usage: cleanup-html <inputFile.html|directory> [outputFile.html]

            This CLI tool processes HTML files by removing:
            - All 'class' and 'id' attributes from HTML elements
            - All <meta>, <style>, <title>, and <head> tags
            - All elements with empty content (i.e., tags with no text or children), iteratively
            - Newline characters and unnecessary spaces between tags
            - Google redirect URLs (e.g., https://www.google.com/url?q=https://example.com)

            For single file usage, provide an input HTML file and an optional output file.
            For directory usage, provide a directory, and all HTML files in that directory will be processed.
            Processed files will be saved with the suffix '_processed.html' unless an output file is provided.

            Examples:
            1. Single file: cleanup-html inputFile.html outputFile.html
            2. Directory: cleanup-html ./my-directory
           `
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
