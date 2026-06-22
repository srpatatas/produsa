import {
  CANVAS_W, CANVAS_H, GRAVITY, BOUNCE_VY, SPRING_VY, MOVE_SPEED, BALL_R, MAX_VY,
  ICE_FRICTION, ICE_ACCEL, TOTAL_LEVELS, GATE_OPEN_SPEED,
  type TriompyState, type Platform, type Flag, type Spike, type Enemy, type Gate,
  type PlatformType,
} from "./gameTypes";

// Fixed flag codes per level — deterministic so players can learn the puzzle
const LEVEL_FLAGS: string[][] = [
  ["ar", "br", "de", "fr", "es", "gb-eng", "it", "pt", "nl", "mx"],
  ["us", "jp", "kr", "ma", "hr", "uy", "co", "se", "au", "ca", "qa", "sa"],
  ["ir", "gh", "sn", "ch", "be", "ec", "dz", "at", "ar", "br", "de", "fr", "es", "gb-eng", "it"],
  ["mx", "us", "jp", "kr", "ma", "hr", "uy", "co", "se", "au", "ca", "qa", "sa", "ir", "gh", "sn", "ch"],
  ["ar", "br", "de", "fr", "es", "gb-eng", "it", "pt", "nl", "mx", "us", "jp", "kr", "ma", "hr", "uy", "co", "se", "au", "ca", "qa", "sa", "ir", "gh", "sn", "ch", "be", "ec", "dz", "at"],
  ["nl", "pt", "be", "hr", "uy", "co", "mx", "se", "au", "ca", "qa", "ir"],
  ["de", "fr", "ar", "br", "es", "gb-eng", "it", "jp", "kr", "ma", "gh", "sn", "ch", "ec"],
  ["at", "dz", "nl", "pt", "be", "hr", "uy", "co", "mx", "se", "au", "ca", "qa", "ir", "us", "jp", "de", "fr"],
];

interface LevelDef {
  platforms: Platform[];
  flags: Flag[];
  spikes: Spike[];
  enemies: Enemy[];
  gate: Gate;
  startX: number;
}

function p(x: number, y: number, w: number, type: PlatformType = "normal", h = 14): Platform {
  return { x, y, w, h, type, crumbled: false, bounceAnim: 0 };
}

// Vertical wall — tall thin platform (acts as barrier, not bounceable)
function wall(x: number, y: number, h: number): Platform {
  return { x, y, w: 12, h, type: "normal", crumbled: false, bounceAnim: 0 };
}

// Staircase — ascending or descending small steps
function stairs(
  startX: number, startY: number,
  steps: number, stepW: number, stepH: number,
  dir: 1 | -1, // 1 = ascending right, -1 = ascending left
  type: PlatformType = "normal",
): Platform[] {
  const result: Platform[] = [];
  for (let i = 0; i < steps; i++) {
    result.push(p(startX + i * (stepW + 4) * dir, startY - i * stepH, stepW, type));
  }
  return result;
}

function f(x: number, y: number, code: string): Flag {
  return { x, y: y - 28, code, collected: false };
}

function sp(x: number, y: number, w: number, flipped = false): Spike {
  return { x, y, w, h: 14, flipped };
}

function en(x: number, y: number, minX: number, maxX: number, speed: number, ci: number): Enemy {
  return { x, y: y - 28, w: 26, h: 26, speed, dir: 1, minX, maxX, comodinIndex: ci % 3 };
}

// Platform width constant for grid-aligned levels
const PW = 55; // standard platform width
const GAP = 12; // gap between platforms

function buildLevel(level: number): LevelDef {
  const platforms: Platform[] = [];
  const flags: Flag[] = [];
  const spikes: Spike[] = [];
  const enemies: Enemy[] = [];
  const codes = LEVEL_FLAGS[Math.min(level - 1, LEVEL_FLAGS.length - 1)];
  let ci = 0;
  const fc = () => codes[ci++ % codes.length];

  // NO full floor — fall = die. Spikes at bottom for visual.
  spikes.push(sp(0, CANVAS_H - 10, CANVAS_W));

  let gate: Gate = { x: 360, y: 100, open: false, openAnim: 0 };
  let startX = 30;

  if (level === 1) {
    // "The Stairway" — Teaches bouncing + staircase navigation.
    // Left staircase up, right staircase up. Bridge at top connects them.
    // Flags on each step. Gate at the very top.
    startX = 25;

    // Spawn platform bottom-left
    platforms.push(p(5, 550, 55));

    // Left ascending staircase — 5 steps going right
    platforms.push(...stairs(5, 490, 5, 30, 55, 1));
    flags.push(f(20, 490, fc()));
    flags.push(f(54, 435, fc()));
    flags.push(f(88, 380, fc()));
    flags.push(f(122, 325, fc()));
    flags.push(f(156, 270, fc()));

    // Bottom right platform — need to reach from spawn or fall
    platforms.push(p(300, 550, 60));
    flags.push(f(325, 550, fc()));

    // Right ascending staircase — 4 steps going left
    platforms.push(...stairs(340, 490, 4, 30, 60, -1));
    flags.push(f(355, 490, fc()));
    flags.push(f(321, 430, fc()));
    flags.push(f(287, 370, fc()));
    flags.push(f(253, 310, fc()));

    // Top bridge — connects left and right staircase tops
    platforms.push(p(160, 215, 65));
    flags.push(f(188, 215, fc()));
    platforms.push(p(240, 215, 50, "crumble"));
    flags.push(f(261, 215, fc()));

    // Gate — top center, reachable from either staircase top
    platforms.push(p(175, 140, 50));
    gate = { x: 196, y: 140, open: false, openAnim: 0 };

  } else if (level === 2) {
    // "Ice Slide" — Ice corridors that slide you across the screen.
    // Land on ice = committed to that direction until you hit a wall.
    // Walls at edges catch you. Must plan which direction to slide.
    startX = 25;

    // Spawn
    platforms.push(p(5, 550, 50));

    // Bottom ice corridor — slides you right into wall
    platforms.push(p(80, 540, 220, "icy"));
    flags.push(f(180, 540, fc()));
    platforms.push(wall(300, 480, 110)); // wall catches slide
    platforms.push(p(315, 540, 55));
    flags.push(f(338, 540, fc()));

    // Ascending staircase right side
    platforms.push(...stairs(340, 480, 3, 28, 55, -1));
    flags.push(f(355, 480, fc()));
    flags.push(f(321, 425, fc()));

    // Mid ice corridor — slides you LEFT this time
    platforms.push(p(100, 400, 200, "icy"));
    flags.push(f(195, 400, fc()));
    platforms.push(wall(85, 340, 110)); // left wall catches
    platforms.push(p(20, 400, 55));
    flags.push(f(43, 400, fc()));

    // Left staircase up
    platforms.push(...stairs(5, 340, 3, 28, 55, 1));
    flags.push(f(20, 340, fc()));
    flags.push(f(54, 285, fc()));

    // Upper ice corridor — slides RIGHT again, but crumble gap!
    platforms.push(p(80, 260, 70, "icy"));
    platforms.push(p(155, 260, 40, "crumble")); // crumble mid-slide!
    platforms.push(p(200, 260, 100, "icy"));
    flags.push(f(245, 260, fc()));
    platforms.push(wall(305, 200, 110));
    platforms.push(p(320, 260, 55));
    flags.push(f(343, 260, fc()));

    // Top staircase to gate
    platforms.push(...stairs(330, 190, 3, 28, 45, -1));
    flags.push(f(345, 190, fc()));
    flags.push(f(311, 145, fc()));

    // Gate — top left
    platforms.push(p(30, 130, 50));
    gate = { x: 51, y: 130, open: false, openAnim: 0 };

  } else if (level === 3) {
    // "The Crumble Tower" — Left staircase up, right staircase down.
    // Central crumble tower must be climbed LAST. Side flags first.
    startX = 25;

    // Spawn bottom-left
    platforms.push(p(5, 550, 55));

    // Left ascending staircase (normal)
    platforms.push(...stairs(5, 480, 3, 28, 70, 1));
    flags.push(f(20, 480, fc()));
    flags.push(f(54, 410, fc()));
    flags.push(f(88, 340, fc()));

    // Left shelf at top of stairs
    platforms.push(p(5, 250, 50));
    flags.push(f(25, 250, fc()));

    // Right descending staircase (some icy — committed slide!)
    platforms.push(p(330, 550, 60));
    flags.push(f(355, 550, fc()));
    platforms.push(...stairs(340, 480, 3, 28, 65, -1, "icy"));
    flags.push(f(355, 480, fc()));
    flags.push(f(321, 415, fc()));
    flags.push(f(287, 350, fc()));

    // Right shelf
    platforms.push(p(335, 265, 55));
    flags.push(f(358, 265, fc()));

    // Central crumble tower — THE PUZZLE. Climb this last!
    // Flags offset to edges so they don't hide under the platform above
    platforms.push(p(145, 530, 80, "crumble"));
    flags.push(f(155, 530, fc()));
    platforms.push(p(155, 430, 70, "crumble"));
    flags.push(f(210, 430, fc()));
    platforms.push(p(145, 330, 80, "crumble"));
    flags.push(f(155, 330, fc()));
    platforms.push(p(155, 235, 70, "crumble"));
    flags.push(f(210, 235, fc()));
    platforms.push(p(160, 150, 60));
    flags.push(f(170, 150, fc()));

    // Enemies patrol between sides and tower
    enemies.push(en(80, 505, 60, 140, 1.2, 0));
    enemies.push(en(240, 400, 230, 330, 1.0, 1));

    // Gate — top of tower
    platforms.push(p(165, 85, 50));
    gate = { x: 186, y: 85, open: false, openAnim: 0 };

  } else if (level === 4) {
    // "Spring Stairs" — Spring staircases + spike ceilings.
    // Springs launch you too high without down-arrow → spike death.
    // Walled channels with staircases inside.
    startX = 20;

    // Spike ceilings — narrow strips, leave crossing gaps clear
    spikes.push(sp(15, 55, 55, true));
    spikes.push(sp(320, 55, 55, true));

    // Spawn
    platforms.push(p(5, 550, 50));

    // Left zone: spring staircase ascending
    platforms.push(...stairs(5, 480, 4, 30, 60, 1, "spring"));
    flags.push(f(20, 480, fc()));
    flags.push(f(54, 420, fc()));
    flags.push(f(88, 360, fc()));
    flags.push(f(122, 300, fc()));

    // Wall separating left from center
    platforms.push(wall(150, 100, 200));
    platforms.push(wall(150, 400, 190));
    // Gap at y=300-400

    // Center zone: normal staircase descending + icy slide
    platforms.push(p(170, 350, 50));
    flags.push(f(190, 350, fc()));
    platforms.push(...stairs(170, 420, 3, 28, 55, 1));
    flags.push(f(204, 420, fc()));
    flags.push(f(238, 475, fc()));

    // Ice corridor at bottom of center — slides to right wall
    platforms.push(p(170, 540, 130, "icy"));
    flags.push(f(230, 540, fc()));
    platforms.push(wall(300, 400, 190));
    // Gap at y=300-400

    // Right zone: crumble staircase + spring to top
    platforms.push(p(315, 550, 55));
    flags.push(f(338, 550, fc()));
    platforms.push(...stairs(340, 480, 3, 28, 60, -1, "crumble"));
    flags.push(f(355, 480, fc()));
    flags.push(f(321, 420, fc()));
    flags.push(f(287, 360, fc()));

    // Spring to top from right
    platforms.push(p(330, 290, 50, "spring"));
    flags.push(f(350, 290, fc()));

    // Enemies between zones
    enemies.push(en(155, 470, 155, 295, 1.3, 1));
    enemies.push(en(160, 320, 155, 295, 1.0, 2));

    // Top crossing
    platforms.push(p(30, 140, 50));
    flags.push(f(50, 140, fc()));
    platforms.push(p(160, 120, 55));
    platforms.push(p(280, 130, 50));
    flags.push(f(300, 130, fc()));
    platforms.push(p(350, 95, 45));
    gate = { x: 368, y: 95, open: false, openAnim: 0 };

  } else if (level === 5) {
    // "The Gauntlet" — Everything combined.
    // Ice slides, crumble staircases, spring launches, walled zones, enemies.
    startX = 20;

    // Spike ceilings — small strips, leave wide crossing gaps
    spikes.push(sp(10, 55, 60, true));
    spikes.push(sp(330, 55, 60, true));

    // --- LEFT SECTION: spawn on ice corridor that slides you right ---
    platforms.push(p(5, 550, 185, "icy"));
    flags.push(f(125, 550, fc()));
    platforms.push(wall(195, 470, 120)); // wall stops slide

    // Crumble staircase ascending (left side)
    platforms.push(...stairs(5, 470, 4, 28, 65, 1, "crumble"));
    flags.push(f(20, 470, fc()));
    flags.push(f(54, 405, fc()));
    flags.push(f(88, 340, fc()));
    flags.push(f(122, 275, fc()));

    // --- CENTER SECTION: walled chamber with spring ---
    platforms.push(wall(80, 100, 170)); // left wall of chamber
    // Gap between walls at y=270-470

    platforms.push(p(100, 530, 80));
    flags.push(f(135, 530, fc()));
    platforms.push(p(100, 420, 60, "spring"));
    flags.push(f(125, 420, fc()));
    platforms.push(p(90, 300, 55));
    flags.push(f(112, 300, fc()));
    platforms.push(p(100, 200, 55, "icy"));
    flags.push(f(122, 200, fc()));

    // --- RIGHT SECTION: open layout, staircase + ice ---
    platforms.push(wall(205, 100, 170)); // right wall of chamber (top only)

    // Right bottom — open, reachable by falling from center gap
    platforms.push(p(220, 550, 55));
    flags.push(f(243, 550, fc()));
    platforms.push(p(340, 540, 50));
    flags.push(f(361, 540, fc()));

    // Right ascending staircase
    platforms.push(...stairs(290, 480, 3, 28, 65, -1));
    flags.push(f(305, 480, fc()));
    flags.push(f(271, 415, fc()));
    flags.push(f(237, 350, fc()));

    // Ice slide — shorter, doesn't block the gap below
    platforms.push(p(250, 290, 90, "icy"));
    flags.push(f(290, 290, fc()));

    // Spring to top from right
    platforms.push(p(350, 220, 40, "spring"));
    flags.push(f(366, 220, fc()));

    // Enemies — patrol between sections, not on platforms
    enemies.push(en(90, 475, 82, 190, 1.3, 0));
    enemies.push(en(220, 330, 210, 345, 1.0, 2));

    // Top crossing to gate — all reachable from center/right tops
    platforms.push(p(160, 115, 50));
    flags.push(f(181, 115, fc()));
    platforms.push(p(280, 120, 50));
    flags.push(f(301, 120, fc()));
    platforms.push(p(350, 90, 45));
    gate = { x: 368, y: 90, open: false, openAnim: 0 };

  } else if (level === 6) {
    // "The Wrap" — Screen wrapping is essential. Platforms on far edges
    // only reachable by wrapping around. Two vertical sections connected
    // only by going off-screen.
    startX = 195;

    // Center spawn
    platforms.push(p(175, 550, 50));

    // Left section — only reachable by wrapping left off-screen
    platforms.push(p(0, 540, 40));
    flags.push(f(16, 540, fc()));
    platforms.push(...stairs(0, 470, 3, 28, 65, 1));
    flags.push(f(15, 470, fc()));
    flags.push(f(49, 405, fc()));
    flags.push(f(83, 340, fc()));
    platforms.push(p(0, 260, 45, "icy"));
    flags.push(f(18, 260, fc()));

    // Right section — only reachable by wrapping right off-screen
    platforms.push(p(360, 540, 40));
    flags.push(f(376, 540, fc()));
    platforms.push(...stairs(365, 470, 3, 28, 65, -1));
    flags.push(f(380, 470, fc()));
    flags.push(f(346, 405, fc()));
    flags.push(f(312, 340, fc()));
    platforms.push(p(355, 260, 40, "icy"));
    flags.push(f(371, 260, fc()));

    // Center tower — crumble, connects to gate
    platforms.push(p(160, 440, 70, "crumble"));
    flags.push(f(190, 440, fc()));
    platforms.push(p(170, 340, 60));
    flags.push(f(196, 340, fc()));
    platforms.push(p(155, 240, 70, "crumble"));
    flags.push(f(185, 240, fc()));

    // Enemy patrols center
    enemies.push(en(160, 390, 100, 280, 1.3, 0));

    // Gate — top center
    platforms.push(p(170, 150, 55));
    gate = { x: 193, y: 150, open: false, openAnim: 0 };

  } else if (level === 7) {
    // "Ice Labyrinth" — Almost everything is ice. Walls everywhere.
    // You slide into walls and must use them to stop. Precise control needed.
    startX = 25;

    // Spawn
    platforms.push(p(5, 550, 45, "icy"));

    // Bottom ice corridor with walls — slide right, hit wall, bounce up
    platforms.push(p(60, 545, 140, "icy"));
    flags.push(f(125, 545, fc()));
    platforms.push(wall(205, 470, 120));
    platforms.push(p(220, 545, 120, "icy"));
    flags.push(f(275, 545, fc()));
    platforms.push(wall(345, 470, 120));
    platforms.push(p(360, 540, 35));
    flags.push(f(374, 540, fc()));

    // Second level — slide left, walls catch
    platforms.push(wall(55, 340, 120));
    platforms.push(p(70, 440, 130, "icy"));
    flags.push(f(130, 440, fc()));
    platforms.push(p(5, 435, 40));
    flags.push(f(21, 435, fc()));
    platforms.push(p(220, 430, 110, "icy"));
    flags.push(f(270, 430, fc()));
    platforms.push(p(350, 425, 45));
    flags.push(f(368, 425, fc()));

    // Third level — alternating ice + normal
    platforms.push(p(10, 330, 40));
    flags.push(f(26, 330, fc()));
    platforms.push(p(80, 335, 100, "icy"));
    flags.push(f(125, 335, fc()));
    platforms.push(wall(185, 260, 90));
    platforms.push(p(200, 325, 80, "icy"));
    flags.push(f(235, 325, fc()));
    platforms.push(p(310, 320, 45));
    flags.push(f(328, 320, fc()));

    // Upper — spring to reach the top
    platforms.push(p(20, 230, 50, "spring"));
    flags.push(f(40, 230, fc()));
    platforms.push(p(130, 210, 50, "icy"));
    flags.push(f(151, 210, fc()));
    platforms.push(p(250, 220, 50));
    flags.push(f(271, 220, fc()));

    // Enemy
    enemies.push(en(80, 390, 70, 200, 1.4, 1));
    enemies.push(en(200, 280, 195, 310, 1.1, 2));

    // Gate — top right
    platforms.push(p(340, 140, 50));
    gate = { x: 361, y: 140, open: false, openAnim: 0 };

  } else {
    // Level 8 — "The Gauntlet" — Everything combined, brutal.
    // Walls, ice slides, crumble staircases, springs, enemies, wrapping.
    // The ultimate test.
    startX = 25;

    // Spike ceiling + floor
    spikes.push(sp(0, 55, 60, true));
    spikes.push(sp(340, 55, 60, true));

    // Left side — crumble staircase going up
    platforms.push(p(5, 540, 45));
    platforms.push(...stairs(5, 470, 3, 28, 70, 1, "crumble"));
    flags.push(f(20, 470, fc()));
    flags.push(f(54, 400, fc()));
    flags.push(f(88, 330, fc()));

    // Left upper — icy slide into left wall
    platforms.push(p(5, 250, 90, "icy"));
    flags.push(f(45, 250, fc()));
    platforms.push(wall(100, 100, 150));
    platforms.push(p(5, 170, 40));
    flags.push(f(21, 170, fc()));

    // Center — walled chamber
    platforms.push(wall(100, 350, 240));
    platforms.push(p(115, 530, 65));
    flags.push(f(143, 530, fc()));
    platforms.push(p(120, 420, 55, "spring"));
    flags.push(f(143, 420, fc()));
    platforms.push(p(115, 290, 60, "icy"));
    flags.push(f(140, 290, fc()));

    // Center upper — spring launch, watch the ceiling spikes!
    platforms.push(p(130, 190, 50));
    flags.push(f(151, 190, fc()));

    // Right wall
    platforms.push(wall(200, 100, 150));
    platforms.push(wall(200, 350, 240));

    // Right side — accessed by wrapping or through wall gap
    platforms.push(p(220, 540, 50));
    flags.push(f(241, 540, fc()));
    platforms.push(...stairs(280, 480, 3, 28, 65, -1));
    flags.push(f(295, 480, fc()));
    flags.push(f(261, 415, fc()));
    flags.push(f(227, 350, fc()));

    // Right upper — crumble bridge to gate
    platforms.push(p(220, 270, 55, "crumble"));
    flags.push(f(243, 270, fc()));
    platforms.push(p(310, 250, 45, "spring"));
    flags.push(f(328, 250, fc()));
    platforms.push(p(350, 170, 45));
    flags.push(f(368, 170, fc()));

    // Enemies — two, away from spawn zones
    enemies.push(en(115, 480, 108, 195, 1.2, 1));
    enemies.push(en(220, 470, 215, 340, 1.3, 2));

    // Gate — top right
    platforms.push(p(340, 105, 50));
    gate = { x: 361, y: 105, open: false, openAnim: 0 };
  }

  return { platforms, flags, spikes, enemies, gate, startX };
}

export function createInitialState(level = 1, prevScore = 0, prevLives = 3): TriompyState {
  const def = buildLevel(level);
  const spawnPlat = def.platforms.find((pl) => def.startX >= pl.x && def.startX <= pl.x + pl.w && pl.h < 30);
  const spawnY = spawnPlat ? spawnPlat.y - BALL_R : CANVAS_H - 30;
  return {
    ballX: def.startX,
    ballY: spawnY,
    vx: 0,
    vy: BOUNCE_VY,
    iceVx: 0,
    onGround: false,
    platforms: def.platforms,
    flags: def.flags,
    spikes: def.spikes,
    enemies: def.enemies,
    gate: def.gate,
    score: prevScore,
    lives: prevLives,
    level,
    status: "playing",
    totalFlags: def.flags.length,
    collectedFlags: 0,
    deathTimer: 0,
    enterAnim: 0,
  };
}

export function nextLevel(prev: TriompyState): TriompyState {
  const next = prev.level + 1;
  if (next > TOTAL_LEVELS) {
    return { ...prev, status: "won" };
  }
  return createInitialState(next, prev.score, prev.lives);
}

interface Input {
  left: boolean;
  right: boolean;
  down: boolean;
  up: boolean;
}

export function tick(state: TriompyState, input: Input, dt: number): TriompyState {
  if (state.status !== "playing" && state.status !== "dying") return state;

  let { ballX, ballY, vx, vy, iceVx, onGround, platforms, flags, spikes, enemies,
    gate, score, lives, status, collectedFlags, deathTimer } = state;

  if (status === "dying") {
    deathTimer -= dt;
    if (deathTimer <= 0) {
      if (lives <= 0) return { ...state, status: "lost", deathTimer: 0 };
      const def = buildLevel(state.level);
      // Find the spawn platform (first platform near startX)
      const spawnPlat = def.platforms.find((pl) => def.startX >= pl.x && def.startX <= pl.x + pl.w && pl.h < 30);
      const spawnY = spawnPlat ? spawnPlat.y - BALL_R : CANVAS_H - 30;
      return {
        ...state,
        ballX: def.startX,
        ballY: spawnY,
        vx: 0, vy: BOUNCE_VY, iceVx: 0,
        onGround: false,
        platforms: def.platforms,
        flags: def.flags.map((fl, i) => ({
          ...fl,
          collected: state.flags[i]?.collected ?? false,
        })),
        spikes: def.spikes,
        enemies: def.enemies,
        gate: { ...def.gate, open: collectedFlags >= state.totalFlags, openAnim: collectedFlags >= state.totalFlags ? 1 : 0 },
        status: "playing",
        deathTimer: 0,
        enterAnim: 0,
      };
    }
    return { ...state, deathTimer };
  }

  // Horizontal: direct control + ice momentum
  let moveX = 0;
  if (input.left) moveX = -MOVE_SPEED;
  if (input.right) moveX = MOVE_SPEED;

  iceVx *= ICE_FRICTION;
  if (Math.abs(iceVx) < 0.1) iceVx = 0;

  vx = (moveX + iceVx) * dt;

  // Down: cut upward velocity
  if (input.down && vy < 0) {
    vy = Math.min(vy + GRAVITY * 4 * dt, 0);
  }

  // Gravity (up arrow boost happens at platform collision, not mid-air)
  vy = Math.min(vy + GRAVITY * dt, MAX_VY);

  onGround = false;
  ballX += vx;
  ballY += vy * dt;

  // Screen wrap horizontal
  if (ballX < -BALL_R) ballX = CANVAS_W + BALL_R;
  if (ballX > CANVAS_W + BALL_R) ballX = -BALL_R;

  // Wall collisions — tall platforms block horizontal movement
  for (const pl of platforms) {
    if (pl.crumbled) continue;
    if (pl.h < 30) continue; // only tall platforms act as walls
    if (
      ballY + BALL_R > pl.y &&
      ballY - BALL_R < pl.y + pl.h
    ) {
      // Moving right into left edge of wall
      if (ballX + BALL_R > pl.x && ballX - BALL_R < pl.x && vx > 0) {
        ballX = pl.x - BALL_R;
        iceVx = 0;
      }
      // Moving left into right edge of wall
      if (ballX - BALL_R < pl.x + pl.w && ballX + BALL_R > pl.x + pl.w && vx < 0) {
        ballX = pl.x + pl.w + BALL_R;
        iceVx = 0;
      }
    }
  }

  // Platform collisions — only when falling, skip walls
  if (vy > 0) {
    for (const pl of platforms) {
      if (pl.crumbled) continue;
      if (pl.h >= 30) continue;
      const prevBottom = ballY + BALL_R - vy * dt;
      if (
        ballX + BALL_R * 0.6 > pl.x &&
        ballX - BALL_R * 0.6 < pl.x + pl.w &&
        prevBottom <= pl.y &&
        ballY + BALL_R >= pl.y
      ) {
        ballY = pl.y - BALL_R;
        onGround = true;

        if (pl.type === "spring") {
          vy = SPRING_VY;
        } else if (input.up) {
          vy = BOUNCE_VY * 1.45;
        } else {
          vy = BOUNCE_VY;
        }

        pl.bounceAnim = input.up ? 1.6 : 1;

        if (pl.type === "crumble") {
          pl.crumbled = true;
        }

        if (pl.type === "icy") {
          if (input.left) iceVx -= ICE_ACCEL;
          else if (input.right) iceVx += ICE_ACCEL;
        } else {
          iceVx = 0;
        }
        break;
      }
    }
  }

  // Flag collection
  for (const fl of flags) {
    if (fl.collected) continue;
    const dx = ballX - fl.x;
    const dy = ballY - fl.y;
    if (Math.abs(dx) < BALL_R + 10 && Math.abs(dy) < BALL_R + 10) {
      fl.collected = true;
      collectedFlags++;
      score += 50;
    }
  }

  // Open gate when all flags collected — start opening animation
  if (collectedFlags >= state.totalFlags && !gate.open) {
    gate = { ...gate, open: true, openAnim: 0.01 };
  }

  // Animate gate opening
  if (gate.open && gate.openAnim < 1) {
    gate = { ...gate, openAnim: Math.min(1, gate.openAnim + GATE_OPEN_SPEED * dt) };
  }

  // Ball entering gate animation
  let { enterAnim } = state;
  if (enterAnim > 0) {
    enterAnim = Math.min(1, enterAnim + 0.04 * dt);
    if (enterAnim >= 1) {
      return {
        ...state, ballX, ballY, vx: 0, vy: 0, iceVx: 0, onGround: false,
        gate, score: score + state.level * 200 + lives * 200, collectedFlags, status: "cleared",
        flags, platforms, enterAnim: 1,
      };
    }
    // Pull ball toward gate center while shrinking
    ballX += (gate.x - ballX) * 0.15 * dt;
    ballY += (gate.y - ballY) * 0.15 * dt;
    return {
      ...state, ballX, ballY, vx: 0, vy: 0, iceVx: 0, onGround: false,
      gate, score, collectedFlags, flags, platforms, enemies, enterAnim,
    };
  }

  // Gate reached — start enter animation (only when fully open)
  if (gate.open && gate.openAnim >= 1) {
    const dx = ballX - gate.x;
    const dy = ballY - gate.y;
    if (Math.abs(dx) < BALL_R + 14 && Math.abs(dy) < BALL_R + 14) {
      return {
        ...state, ballX, ballY, vx: 0, vy: 0, iceVx: 0, onGround: false,
        gate, score, collectedFlags, flags, platforms, enemies, enterAnim: 0.01,
      };
    }
  }

  // Spike collision
  for (const s of spikes) {
    if (
      ballX + BALL_R > s.x &&
      ballX - BALL_R < s.x + s.w &&
      ballY + BALL_R > s.y &&
      ballY - BALL_R < s.y + s.h
    ) {
      lives--;
      return {
        ...state, ballX, ballY, vx: 0, vy: 0, iceVx: 0,
        lives, score, collectedFlags, gate, status: lives <= 0 ? "lost" : "dying", deathTimer: 45,
        flags, platforms,
      };
    }
  }

  // Enemy collision
  for (const e of enemies) {
    if (
      ballX + BALL_R > e.x &&
      ballX - BALL_R < e.x + e.w &&
      ballY + BALL_R > e.y &&
      ballY - BALL_R < e.y + e.h
    ) {
      lives--;
      return {
        ...state, ballX, ballY, vx: 0, vy: 0, iceVx: 0,
        lives, score, collectedFlags, gate, status: lives <= 0 ? "lost" : "dying", deathTimer: 45,
        flags, platforms,
      };
    }
  }

  // Move enemies
  for (const e of enemies) {
    e.x += e.speed * e.dir * dt;
    if (e.x <= e.minX) { e.x = e.minX; e.dir = 1; }
    if (e.x + e.w >= e.maxX) { e.x = e.maxX - e.w; e.dir = -1; }
  }

  // Fall off bottom
  if (ballY > CANVAS_H + BALL_R * 2) {
    lives--;
    return {
      ...state, ballX: CANVAS_W / 2, ballY: CANVAS_H - 14 - BALL_R,
      vx: 0, vy: BOUNCE_VY, iceVx: 0, onGround: false,
      lives, score, collectedFlags, gate, status: lives <= 0 ? "lost" : "dying", deathTimer: 45,
      flags, platforms,
    };
  }

  // Decay platform bounce animations
  for (const pl of platforms) {
    if (pl.bounceAnim > 0) pl.bounceAnim = Math.max(0, pl.bounceAnim - 0.08 * dt);
  }

  return {
    ...state, ballX, ballY, vx, vy, iceVx, onGround,
    score, collectedFlags, gate, flags, platforms, enemies,
  };
}
