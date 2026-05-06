# Flesh / Code  
### MCBW 2026 — Playgrounds of Care

Interactive audiovisual installation exploring the relationship between physical intervention and computational reaction.

Created for:

**Playgrounds of Care — Socialization between Flesh and Code**  
MUC.DAI — Munich Center for Digital Sciences and AI  
Munich Creative Business Week (MCBW)

---

## Concept

The installation reacts to physical movement with digital glitches.

Small red markers attached to a semi-transparent curtain are tracked through a webcam.  
As the fabric moves, the system generates visual distortions and fragmented reactions.

The glitches act as a metaphor for the way AI and coding agents increasingly interfere with creative and learning processes.

Instead of supporting invisibly in the background, the system becomes visible through interruptions, errors, overreactions, and noise.

The project reflects on how coding agents and AI-assisted workflows increasingly shape creative learning processes:
- accelerating production
- reshaping experimentation
- reducing friction
- but also introducing opacity, dependency, and loss of authorship

The installation asks:

> What happens when creative processes are no longer fully human, but negotiated between flesh and code?

---

## Visual Structure

The visual system consists of three layers:

### 1. Background Layer
Slowly moving colored rectangles form a dynamic computational field.

### 2. Text Layer
Fragmented white code drifts subtly across the projection surface.  
The code acts simultaneously as language, texture, and atmosphere.

### 3. Glitch Layer
Triggered only by movement of the tracked red markers.

As the curtain shifts, the system produces bursts of digital interference, representing moments of computational overreaction and machine interpretation.

---

## Interaction

Participants interact indirectly through movement of the curtain.

The system tracks:
- movement
- velocity
- continuity across frames
- spatial displacement of red markers

Sustained movement activates the glitch layer.

Small movements create subtle reactions, while stronger gestures generate denser distortions.

---

## Technologies

- p5.js
- OpenCV.js
- JavaScript
- Real-time computer vision tracking

---

## Running the Project

Open the project folder in a terminal and run:

```bash
npx serve .
```
Then open the local address shown in the terminal
(example: http://localhost:3000)

Crome Full Screen: 
```bash
Cmd + Shift + F
```
---

## Debug Mode

You can toggle a visual debug overlay during runtime:

- Press `D` to toggle debug mode ON/OFF.
- The debug UI is rendered on the canvas

When debug mode is ON:
- Red dots show all currently tracked red markers.
- Green rings show markers currently classified as moving.
- A status box in the top-left shows:
	- `tracked` (number of detected points)
	- `moving` (number of moving points)
	- `cv ready` (whether OpenCV is loaded)

---

## Authors
Annika Bürsner
Rose Altmann
Katharina Brandtner

Munich, 2026