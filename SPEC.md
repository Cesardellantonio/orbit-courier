# Orbit Courier v1

Goal: deliver a packet between five slowly orbiting hubs: NOVA, KEPLER, LYRA, ATLAS, and SOL. The cyan hub is your source; the gold hub is your destination. Aim ahead of its motion and avoid other hubs.

Controls: tap/click an aim point to launch from the source, or press the source, drag/swipe toward your aim, and release. The dotted line previews your heading. One packet flies at a time. Touch and mouse share pointer controls; no hover required.

Scoring: each delivery earns 100 points and makes the destination your new source. The next target is highlighted automatically.

Lives: start with 3 shields. Hitting a wrong hub, leaving the playfield, or timing out costs one shield. At 0 lives the shift ends; Restart shift resets the game.

Presentation: a responsive, single-screen dark space canvas with score, shields, target name, and a game-over panel. Runs offline by opening index.html; engine.js retains the Orbit.createGame/launch/step API. Simulation uses a fixed 360 × 480 logical playfield, scaled to the viewport.
