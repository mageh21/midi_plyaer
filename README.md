# MIDIano - MIDI Piano Visualizer

MIDIano is a JavaScript MIDI player/visualizer that shows MIDI notes on a piano and can also display sheet music notation.

## Features

- Piano visualization of MIDI files
- Sheet music display synced with MIDI playback
- MIDI keyboard input support
- Audio playback with various soundfonts
- Customizable visual settings

## New Feature: Sheet Music Display

MIDIano now includes sheet music visualization! The new features:

- Real-time sheet music display that follows the MIDI playback
- Synchronized highlighting of currently played notes
- Toggle sheet music display on/off in settings

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Run `npm run build` to build the application
4. Open `index.html` in your browser

## Usage

- Load a MIDI file using the interface
- Toggle the sheet music display in the settings panel
- Play/pause the MIDI playback
- The piano and sheet music will visualize the notes as they play

## Technologies Used

*   **JavaScript (ES6+ Modules):** Core application logic.
*   **HTML5 Canvas:** For rendering the piano roll and sheet music.
*   **VexFlow:** Library for rendering musical notation.
*   **Node.js:** Required for the development environment and build process.
*   **npm:** Package management.
*   **Webpack:** Used to bundle JavaScript modules and CSS for the browser.
*   **(Potentially others based on your `package.json`)**

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mageh21/midi_plyaer.git
    cd midi_plyaer
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Building

This project uses Webpack to bundle its assets. To build the project after making changes to the source files (like in the `js/` directory), run:

```bash
npm run build
```

This will generate the necessary files (e.g., `dist/bundle.js`) in the `dist/` directory.

## Running

After building the project, you can run it by opening the `index.html` file in your web browser.

For the best experience and to avoid potential issues with file loading (like CORS), it's recommended to use a simple local web server:

1.  **Using `npx` (no installation needed):**
    ```bash
    npx http-server .
    ```
2.  **Using Python's built-in server (if Python is installed):**
    *   Python 3: `python -m http.server`
    *   Python 2: `python -m SimpleHTTPServer`

Then, navigate to the local address provided by the server (usually `http://localhost:8080` or similar) in your browser.

## Contributing

_(Optional: Add guidelines if you want others to contribute)_

## License

_(Optional: Add a license, e.g., MIT, Apache 2.0)_