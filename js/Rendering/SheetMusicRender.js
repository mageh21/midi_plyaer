import { Factory } from 'vexflow';
import { CONST } from "../data/CONST.js"; // Import CONST for MIDI_NOTE_TO_KEY

export class SheetMusicRender {
    constructor(containerId) {
        this.containerId = containerId;
        this.vf = null;
        this.context = null;
        this.stave = null;
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Sheet music container #${this.containerId} not found.`);
            return;
        }
        // Clear previous content if any
        container.innerHTML = '';

        // Create VexFlow Factory
        this.vf = new Factory({
            renderer: { 
                elementId: this.containerId, 
                width: container.offsetWidth, 
                height: 200 // Initial height, adjust as needed
            }
        });
        this.context = this.vf.getContext();

        // Basic stave setup (example)
        this.stave = this.vf.Stave(10, 40, container.offsetWidth - 20); // x, y, width
        this.stave.addClef("treble").addTimeSignature("4/4");
        this.stave.setContext(this.context).draw();

        console.log("VexFlow initialized for sheet music.");
    }

    render(songData, currentTime) {
        if (!this.vf || !songData || currentTime === undefined) {
            return; 
        }

        this.context.clear(); 
        this.stave.draw();

        // --- Basic Note Conversion (Pitch only, Fixed Duration) ---
        const notesToDraw = [];
        const timeWindowStart = currentTime; // Show notes starting around current time
        const timeWindowEnd = currentTime + 4; // Look ahead a few seconds (adjust as needed)
        const defaultDuration = "q"; // Draw all as quarter notes for now

        // Crude way to get notes in window (needs improvement)
        const notesInWindow = songData.getNotes(timeWindowStart, timeWindowEnd) || [];
        // Alternative if getNotesInTimeWindow doesn't exist:
        // Iterate through songData.notesBySeconds or songData.getNoteSequence()

        console.log(`[SheetMusic] Time: ${currentTime.toFixed(2)}, Notes in Window: ${notesInWindow.length}`); // DEBUG LOG

        notesInWindow.forEach(note => {
            const key = this.midiNoteToVexflowKey(note.noteNumber);
            if (key) {
                try {
                     // Basic note creation - ignores actual duration, ties, beams, etc.
                    const vfNote = this.vf.StaveNote({
                        keys: [key],
                        duration: defaultDuration
                    });
                    // Add accidental if needed (basic check)
                    if (key.includes("#") || key.includes("b")) {
                        const accidentalType = key.includes("#") ? "#" : "b";
                        vfNote.addAccidental(0, this.vf.Accidental({ type: accidentalType }));
                    }
                    notesToDraw.push(vfNote);
                } catch (e) {
                    console.warn("VexFlow error creating note:", key, e);
                }
            }
        });

        console.log(`[SheetMusic] Notes to Draw: ${notesToDraw.length}`); // DEBUG LOG

        // --- Format and Draw --- 
        if (notesToDraw.length > 0) {
             try {
                // Attempt to format and draw - might fail if durations don't fit measure
                const voice = this.vf.Voice({ num_beats: 4, beat_value: 4 }); // Assume 4/4
                voice.setStrict(false); // Allow potentially overflowing measures for now
                voice.addTickables(notesToDraw);
                
                // TEMP: Disable formatter for debugging - might draw notes overlapping
                // this.vf.Formatter.FormatAndJustify([voice], this.stave.width - 50); 
                
                voice.draw(this.context, this.stave);
            } catch(e) {
                console.error("VexFlow formatting/drawing error:", e)
                // Clear notes if formatting fails badly
                this.context.clear(); 
                this.stave.draw();
            }
        }
        // --- End Note Conversion ---
    }

    // Helper function to convert MIDI note number to VexFlow key string
    midiNoteToVexflowKey(noteNumber) {
        const keyData = CONST.MIDI_NOTE_TO_KEY[noteNumber + 21]; // +21 seems to be offset used elsewhere
        if (!keyData) return null;

        const noteName = keyData.slice(0, -1); // e.g., "C#"
        const octave = keyData.slice(-1);

        let vexKey = noteName.toLowerCase().replace("#", "#") + "/" + octave;
        // VexFlow expects flats as 'b', sharps as '#' already correct
        return vexKey;
    }

    resize(width) {
        if(this.vf) {
            console.log("Resizing sheet music container.");
            // Re-initialize to handle resize correctly for now
            this.init(); 
        }
    }
} 