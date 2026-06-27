import fs from "fs";
import vm from "vm";

const HTML_PATH = "/home/potatoking/family-archive/public/children_of_frontier.html";

// Custom Mock VM Sandbox to run raw HTML game logic without JSDOM dependencies
function loadGameContext() {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  
  // Extract Javascript code between script tags
  const startTag = "<script>";
  const endTag = "</script>";
  const scriptContent = html.substring(
    html.indexOf(startTag) + startTag.length,
    html.lastIndexOf(endTag)
  );

  // Exporter suffix to expose const/let declarations to the VM global context
  const exportSuffix = `
    this.state = state;
    this.EVENT_DECK = EVENT_DECK;
    this.graveLogEntries = graveLogEntries;
    this.WEATHER_STATES = WEATHER_STATES;
  `;
  const fullScript = scriptContent + exportSuffix;

  // Mock DOM elements and document queries to prevent reference errors during execution
  const createMockElement = () => {
    const el: any = {
      textContent: "",
      innerHTML: "",
      children: [],
      appendChild(child: any) {
        el.children.push(child);
        return child;
      },
      removeChild(child: any) {
        const idx = el.children.indexOf(child);
        if (idx !== -1) el.children.splice(idx, 1);
        return child;
      },
      get firstChild() {
        return el.children[0];
      },
      classList: {
        toggle: () => {},
        add: () => {},
        remove: () => {},
      },
      style: { transform: "" },
      addEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => createMockElement(), // Return a mock element so nested selectors never crash
    };
    return el;
  };

  const mockElement = createMockElement();

  const mockCanvasContext = {
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    ellipse: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillText: () => {},
    strokeRect: () => {},
    setLineDash: () => {},
  };

  const mockCanvas = {
    getContext: () => mockCanvasContext,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }),
    addEventListener: () => {},
    width: 1100,
    height: 440,
  };

  const mockDocument = {
    getElementById: (id: string) => {
      if (id === "gameCanvas") return mockCanvas;
      return createMockElement(); // Return a fresh mock element each time to avoid sharing children lists across logs/HUD
    },
    createElement: () => createMockElement(),
    addEventListener: () => {},
  };

  // Mock global fetch returning populated crews matching CLANS schema
  const mockFetch = (url: string) => {
    return Promise.resolve({
      json: () => {
        if (url.includes("/api/game-data")) {
          return Promise.resolve({
            success: true,
            crews: {
              dyer: {
                name: "Dyer Clan",
                intro: "Dyers",
                crew: [
                  { name: "George Washington Dyer", trait: "Resilient" },
                  { name: "Elizabeth Ellen Conlee", trait: "Wise" },
                  { name: "Glenn Milton Dyer", trait: "Athletic" },
                  { name: "George Hollis Dyer", trait: "Charming" }
                ]
              },
              ramsey: {
                name: "Ramsey Clan",
                intro: "Ramseys",
                crew: [
                  { name: "Armina Ramsey", trait: "Resilient" },
                  { name: "Anderson Edwards", trait: "Athletic" },
                  { name: "Silas Josiah Edwards", trait: "Charming" },
                  { name: "Edith Ann Edwards", trait: "Wise" }
                ]
              }
            },
            dynamicEvents: []
          });
        }
        return Promise.resolve({ success: true });
      }
    });
  };

  const mockLocalStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };

  // Node VM sandbox context with standard mocks
  const sandbox = {
    document: mockDocument,
    window: {
      addEventListener: () => {},
      AudioContext: class {
        createBufferSource() { return { connect: () => {}, start: () => {} }; }
        createBuffer() { return { getChannelData: () => ({}) }; }
        createOscillator() { return { type: "", frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
        createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
        get currentTime() { return 0; }
        destination: {}
      }
    },
    localStorage: mockLocalStorage,
    fetch: mockFetch,
    canvas: mockCanvas,
    ctx: mockCanvasContext,
    statusLine: mockElement,
    startOverlay: mockElement,
    pauseOverlay: mockElement,
    endOverlay: mockElement,
    endEyebrow: mockElement,
    endTitle: mockElement,
    endCopy: mockElement,
    pauseStats: mockElement,
    crewGrid: mockElement,
    logPanel: mockElement,
    eventPanel: mockElement,
    choiceRow: mockElement,
    consoleTitle: mockElement,
    distanceValue: mockElement,
    rationsValue: mockElement,
    ammoValue: mockElement,
    medicineValue: mockElement,
    karmaValue: mockElement,
    weatherValue: mockElement,
    wheelRow: mockElement,
    trailMeta: mockElement,
    dyerButton: mockElement,
    ramseyButton: mockElement,
    startButton: mockElement,
    travelButton: mockElement,
    huntButton: mockElement,
    campButton: mockElement,
    helpButton: mockElement,
    resumeButton: mockElement,
    restartButton: mockElement,
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    console,
    setTimeout,
    requestAnimationFrame: () => {},
  };

  // Create context and evaluate the game code
  vm.createContext(sandbox);
  vm.runInContext(fullScript, sandbox);

  return sandbox;
}

describe("Children of the Frontier Game Logic (VM-sandbox)", () => {
  let context: any;

  beforeEach(() => {
    context = loadGameContext();
    context.restartRun();
    context.selectClan("dyer");
    context.beginFromSelection();
  });

  test("Event Deck has 15 valid moral events", () => {
    const deck = context.EVENT_DECK;
    expect(context.Array.isArray(deck)).toBe(true);
    expect(deck.length).toBeGreaterThanOrEqual(10);

    for (const event of deck) {
      expect(event.id).toBeDefined();
      expect(event.title).toBeDefined();
      expect(event.text).toBeDefined();
      expect(context.Array.isArray(event.options)).toBe(true);
      expect(event.options.length).toBeGreaterThanOrEqual(3);

      for (const option of event.options) {
        expect(typeof option.label).toBe("string");
        expect(typeof option.detail).toBe("string");
        expect(typeof option.apply).toBe("function");
      }
    }
  });

  test("Karma limits clamp 0-100 and trigger life loss at 0", () => {
    context.state.karma = 50;
    context.state.wheels = 5;

    // Karma increases correctly
    context.addKarma(30);
    expect(context.state.karma).toBe(80);

    // Karma clamps to maximum of 100
    context.addKarma(50);
    expect(context.state.karma).toBe(100);

    // Hitting 0 triggers wheel loss and snaps back to checkpoint
    context.addKarma(-100);
    expect(context.state.wheels).toBe(4);
    expect(context.state.karma).toBe(50); // Snapshot rollback restores karma to 50
  });

  test("Weather modifiers apply correct resource skews", () => {
    const snowyEffects = context.weatherEffects("Snowy");
    expect(snowyEffects.rations).toBe(2);

    const rainyEffects = context.weatherEffects("Rainy");
    expect(rainyEffects.wagonDecay).toBe(2);

    const dustyEffects = context.weatherEffects("Dusty");
    expect(dustyEffects.travelMultiplier).toBe(0.5);
  });

  test("Crew Health decay triggers death and adds to Grave Log", () => {
    const startCount = context.livingCount();
    expect(startCount).toBe(4);

    context.injureCrew("all", 110, "scurvy outbreak");

    expect(context.livingCount()).toBe(0);
    expect(context.graveLogEntries.length).toBe(4);
    expect(context.graveLogEntries[0].cause).toBe("scurvy outbreak");
  });
});
