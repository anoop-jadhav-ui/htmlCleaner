# HTML Cleaner

This project is a simple HTML cleaner built with Deno.

## Features

- Cleans and formats HTML files.
- Removes unnecessary tags and attributes.
- Minifies HTML for optimized performance.

## Installation

To install the dependencies, run:

```sh
deno install --allow-read --allow-write https://deno.land/x/html_cleaner/cli.ts
```

## Usage

To clean an HTML file, use the following command:

```sh
deno run --allow-read --allow-write main.ts <input-file> <output-file>
```

Example:

```sh
deno run --allow-read --allow-write main.ts input.html output.html
```

## Build CLI

To create CLI file i.e. htmlParser

```sh
deno task build
```

Run cli -

Go to dist

```sh
./htmlCleaner ./blogs 
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.