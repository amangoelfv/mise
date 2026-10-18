"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { CatalogDish } from "@/lib/catalog";
import { ApiError, api, errorMessage, scaleQuantity } from "@/lib/client";
import type { CartStatus } from "@/lib/contract";
import { proteinTargetG } from "@/lib/nutrition";
import { avoidList, getPrefs, setPrefsUser } from "@/lib/prefs";
import { styleById } from "@/lib/styles";
import { addToWishlist, setWishlistUser } from "@/lib/wishlist";
import type { CartBody, DishVariant, IngredientsOk, VariantsOk, VariantsResult, ZeptoState } from "@/lib/types";
import { Dialog } from "../dialog";
import { DishInput } from "../dish-input";
import { DishMenu } from "../dish-menu";
import { Orb } from "../orb";
import { ZeptoConnect } from "../zepto-connect";
import { CartView, EMPTY_EDITS, effectiveCart, type CartEdits, type CartPhase } from "./cart-view";
import { IngredientList } from "./ingredient-list";
import { OrderConfirm, type DeliveryDetails } from "./order-confirm";
import { ProfileDialog } from "./profile-dialog";
import { StylePicker } from "./style-picker";

type Stage = "ask" | "styles" | "ingredients" | "cart";
const STAGES: { id: Stage; label: string }[] = [
  { id: "ask", label: "Dish" },
  { id: "styles", label: "Style" },
  { id: "ingredients", label: "Ingredients" },
  { id: "cart", label: "Cart" },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Each forward step pushes one history entry (same URL, step in history.state), so the browser's
 * Back button / swipe walks back through the flow instead of leaving /app. Steps only ever advance
 * by one, so a stage's index equals its distance from the "ask" entry.
 */
const ORDER: Record<Stage, number> = { ask: 0, styles: 1, ingredients: 2, cart: 3 };
const isStage = (value: unknown): value is Stage => typeof value === "string" && value in ORDER;
const pushStep = (step: Stage) => window.history.pushState({ ...window.history.state, miseStep: step }, "");
const replaceStep = (step: Stage, url?: string) => window.history.replaceState({ ...window.history.state, miseStep: step }, "", url);

export function Flow({
  userId,
  firstName,
  initialQuery,
  zepto: initialZepto,
  simulatedCart,
  catalog,
}: {
  userId: string;
  firstName: string;
  initialQuery: string;
  zepto: ZeptoState;
  simulatedCart: boolean;
  catalog: CatalogDish[];
}) {
  // Before any getPrefs()/addToWishlist() call below, so they resolve against this account's record.
  setPrefsUser(userId);
  setWishlistUser(userId);

  const [stage, setStage] = useState<Stage>(initialQuery ? "styles" : "ask");
  const [query, setQuery] = useState(initialQuery);
  const [variants, setVariants] = useState<VariantsOk | null>(null);
  const [variantsError, setVariantsError] = useState<{ message: string; suggestions?: string[] } | null>(null);
  const [choice, setChoice] = useState<DishVariant | null>(null);
  const [list, setList] = useState<IngredientsOk | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [servings, setServings] = useState(2);
  const [cart, setCart] = useState<CartPhase | null>(null);
  const [zepto, setZepto] = useState(initialZepto);
  const [connectOpen, setConnectOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [cartEdits, setCartEdits] = useState<CartEdits>(EMPTY_EDITS);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savedToPlan, setSavedToPlan] = useState(false);

  // Every new request bumps this; responses for older requests are dropped.
  const requestId = useRef(0);
  const buildAfterConnect = useRef(false);
  // Set before a history jump back to "ask" that should also clear the dish ("Cook something else").
  const resetOnPop = useRef(false);
  // The dish waiting on the first-run profile questions, fetched once they are answered or skipped.
  const pendingDish = useRef("");

  const items = useMemo(
    () =>
      list
        ? list.items.map((item) => ({
            ...item,
            quantity: scaleQuantity(item.quantity, item.unit, servings / list.servings),
          }))
        : [],
    [list, servings],
  );
  const chosen = items.filter((item) => !excluded.has(item.id));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  const loadingVariants = stage === "styles" && !variants && !variantsError;
  const loadingList = stage === "ingredients" && !list && !listError;
  const building = stage === "cart" && cart?.phase === "building";
  const thinking = loadingVariants || loadingList || building;

  async function fetchVariants(dish: string) {
    const id = ++requestId.current;
    const prefs = getPrefs();
    try {
      const res = await api<VariantsResult>("/api/dish/variants", {
        body: {
          query: dish,
          diet: prefs.diet,
          avoid: avoidList(prefs),
          budget: prefs.budget,
          proteinTargetG: proteinTargetG(prefs.ageBand, prefs.weightKg),
        },
      });
      if (id !== requestId.current) return;
      if (res.ok) setVariants(res);
      else setVariantsError({ message: res.message, suggestions: res.suggestions });
    } catch (e) {
      if (id === requestId.current) setVariantsError({ message: errorMessage(e) });
    }
  }

  const boot = useEffectEvent(() => {
    if (initialQuery) {
      // Arrived with ?q=: make this entry "ask" so Back lands on the dish screen, then step forward.
      replaceStep("ask", "/app");
      pushStep("styles");
      askProfileOr(initialQuery);
    } else {
      replaceStep("ask");
    }
  });
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    boot();
  }, []);

  /** First dish on this device for this account: ask the profile questions before suggesting. */
  function askProfileOr(dish: string) {
    if (getPrefs().profileStatus === "unset") {
      pendingDish.current = dish;
      setProfileOpen(true);
      return;
    }
    void fetchVariants(dish);
  }

  function profileDone() {
    setProfileOpen(false);
    const dish = pendingDish.current;
    pendingDish.current = "";
    if (dish) void fetchVariants(dish);
  }

  function applyStage(target: Stage) {
    requestId.current++;
    // Never leave a modal over a screen the user navigated away from. Clear the waiting dish
    // first: closing the dialog runs its skip handler, which would otherwise fetch variants for
    // a dish the person just walked away from and show them on the way forward again.
    pendingDish.current = "";
    setProfileOpen(false);
    if (resetOnPop.current) {
      resetOnPop.current = false;
      setQuery("");
      setVariants(null);
      setVariantsError(null);
      setChoice(null);
      setList(null);
      setCart(null);
      setStage("ask");
      return;
    }
    if (target === "cart") {
      if (cart) setStage("cart");
      return;
    }
    setCart(null);
    if (target === "ingredients") setStage(list && choice ? "ingredients" : variants ? "styles" : "ask");
    else if (target === "styles") setStage(variants || variantsError ? "styles" : "ask");
    else setStage("ask");
  }

  /** Browser Back/Forward: move to the step stored on that history entry (if we still have its data). */
  const onPopState = useEffectEvent((event: PopStateEvent) => {
    const step = (event.state as { miseStep?: unknown } | null)?.miseStep;
    if (isStage(step)) applyStage(step);
  });
  useEffect(() => {
    const listener = (event: PopStateEvent) => onPopState(event);
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  function askDish(dish: string) {
    const trimmed = dish.trim();
    if (trimmed.length < 2) return;
    // From the dish screen this is a step forward; from styles (retry, menu suggestion) it replaces.
    if (stage === "ask") pushStep("styles");
    else replaceStep("styles");
    setQuery(trimmed);
    setStage("styles");
    setVariants(null);
    setVariantsError(null);
    setChoice(null);
    setList(null);
    setCart(null);
    askProfileOr(trimmed);
  }

  async function chooseStyle(variant: DishVariant) {
    if (!variants) return;
    const prefs = getPrefs();
    if (stage === "styles") pushStep("ingredients");
    setChoice(variant);
    setStage("ingredients");
    setList(null);
    setListError(null);
    setCart(null);
    setSavedToPlan(false);
    const id = ++requestId.current;
    try {
      const res = await api<IngredientsOk>("/api/dish/ingredients", {
        body: {
          dish: variants.dish,
          cuisine: variants.cuisine,
          style: variant.style,
          variant: { title: variant.title, tagline: variant.tagline, highlights: variant.highlights },
          servings: prefs.servings,
          diet: prefs.diet,
          avoid: avoidList(prefs),
          budget: prefs.budget,
        },
      });
      if (id !== requestId.current) return;
      setList(res);
      setServings(res.servings);
      setExcluded(new Set(prefs.skipStaples ? res.items.filter((i) => i.pantryStaple).map((i) => i.id) : []));
    } catch (e) {
      if (id === requestId.current) setListError(errorMessage(e));
    }
  }

  function saveToPlan() {
    if (!variants || !choice) return;
    addToWishlist({ dish: variants.dish, style: choice.style, variantTitle: choice.title, cuisine: variants.cuisine });
    setSavedToPlan(true);
  }

  function cartBody(dryRun = false): CartBody | null {
    if (!variants || !choice) return null;
    const prefs = getPrefs();
    return {
      dish: { query, name: variants.dish, cuisine: variants.cuisine, style: choice.style, variantTitle: choice.title },
      servings,
      items: chosen,
      diet: prefs.diet,
      avoid: avoidList(prefs),
      budget: prefs.budget,
      pincode: prefs.pincode,
      dryRun,
    };
  }

  async function buildCart(connected = zepto.connected) {
    const body = cartBody();
    if (!body || !body.items.length) return;
    if (!connected) {
      buildAfterConnect.current = true;
      setConnectOpen(true);
      return;
    }
    if (stage === "ingredients") pushStep("cart");
    setStage("cart");
    setCart({ phase: "building" });
    setCartEdits(EMPTY_EDITS); // fresh cart, no edits yet
    const id = ++requestId.current;
    try {
      let { status } = await api<{ status: CartStatus }>("/api/cart", { body });
      const started = Date.now();
      while (status.status === "processing" && Date.now() - started < 120_000) {
        await sleep(1500);
        if (id !== requestId.current) return;
        ({ status } = await api<{ status: CartStatus }>(`/api/cart/${encodeURIComponent(status.cartId)}`));
      }
      if (id !== requestId.current) return;
      if (status.status === "ready" || status.status === "partial") {
        setCart({ phase: "ready", status });
      } else {
        setCart({
          phase: "failed",
          message:
            status.message ||
            (status.status === "processing" ? "Zepto is taking longer than usual." : "Zepto couldn't build this cart."),
        });
      }
    } catch (e) {
      if (id !== requestId.current) return;
      if (e instanceof ApiError && e.code === "connect_zepto") {
        setZepto({ connected: false });
        window.history.back(); // undo the cart step; popstate returns us to ingredients
        setCart(null);
        buildAfterConnect.current = true;
        setConnectOpen(true);
        return;
      }
      setCart({ phase: "failed", message: errorMessage(e) });
    }
  }

  function removeLine(key: string) {
    setCartEdits((prev) => ({ ...prev, removed: new Set(prev.removed).add(key) }));
  }
  function addBackLine(key: string) {
    // Un-remove if it was removed, and mark it added so effectiveCart includes the skipped item's line.
    setCartEdits((prev) => {
      const removed = new Set(prev.removed);
      removed.delete(key);
      return { ...prev, added: new Set(prev.added).add(key), removed };
    });
  }
  function changeQty(key: string, delta: number) {
    if (!cart || (cart.phase !== "ready" && cart.phase !== "placing")) return;
    const line = cart.status.lines.find((l) => `${l.ingredientId}-${l.productId}` === key);
    if (!line) return;
    const current = cartEdits.qty[key] ?? line.quantity;
    const next = Math.max(1, Math.min(99, current + delta));
    setCartEdits((prev) => ({ ...prev, qty: { ...prev.qty, [key]: next } }));
  }

  async function placeOrder(details: DeliveryDetails) {
    if (!cart || cart.phase !== "ready") return;
    const status = cart.status;
    const eff = effectiveCart(status, cartEdits); // honour the user's in-cart edits
    setPlacing(true);
    setPlaceError(null);
    try {
      const { order } = await api<{ order: { id: string; status: string; etaMinutes?: number } }>("/api/orders", {
        body: {
          cartId: status.cartId,
          dish: {
            name: variants?.dish ?? query,
            variantTitle: choice?.title ?? "",
            styleLabel: choice ? styleById(choice.style).label : "",
          },
          lines: eff.lines.map((l) => ({
            name: l.name,
            packSize: l.packSize,
            quantity: l.quantity,
            priceInr: l.priceInr,
            imageUrl: l.imageUrl,
          })),
          totals: { itemsInr: eff.itemsInr, deliveryInr: eff.deliveryInr, totalInr: eff.totalInr },
          etaMinutes: status.etaMinutes,
          contact: { name: details.name, phone: details.phone },
          address: { line: details.address, landmark: details.landmark, pincode: getPrefs().pincode },
        },
      });
      setConfirmOpen(false);
      setCart({ phase: "placed", status, order, address: details.address });
    } catch (e) {
      setPlaceError(errorMessage(e));
    } finally {
      setPlacing(false);
    }
  }

  /** In-app back controls go through history too, so the browser stack and the screen never disagree. */
  function goTo(target: Stage) {
    const steps = ORDER[target] - ORDER[stage];
    if (steps < 0) window.history.go(steps);
  }

  function startOver() {
    if (ORDER[stage] === 0) return;
    resetOnPop.current = true;
    window.history.go(-ORDER[stage]);
  }

  const orbSize =
    stage === "ask"
      ? "size-[200px] sm:size-[260px] mt-[4vh]"
      : stage === "cart"
        ? "size-[150px] sm:size-[180px] mt-6"
        : thinking
          ? "size-32 mt-4"
          : "size-20 mt-4";

  const reached = STAGES.findIndex((s) => s.id === stage);

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-40 sm:px-8">
      {stage !== "ask" && (
        <nav aria-label="Progress" className="animate-fade mx-auto mt-6 flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em]">
          {STAGES.map((s, i) => {
            const clickable = i < reached && !building && (s.id !== "ingredients" || !!list);
            return (
              <span key={s.id} className="flex items-center gap-1">
                {i > 0 && <span className="w-4 border-t border-dotted border-paper/25 sm:w-8" />}
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => goTo(s.id)}
                  aria-current={i === reached ? "step" : undefined}
                  className={`rounded-md px-2 py-1 transition ${i === reached ? "text-paper" : clickable ? "text-paper/45 hover:text-saffron" : "text-paper/20"}`}
                >
                  <span className={i === reached ? "text-saffron" : ""}>{String(i + 1).padStart(2, "0")}</span>{" "}
                  <span className="max-sm:hidden">{s.label}</span>
                </button>
              </span>
            );
          })}
        </nav>
      )}

      <div className={`mx-auto shrink-0 transition-all duration-700 ease-out-expo ${orbSize}`}>
        <Orb energy={thinking ? 1 : stage === "ask" ? 0.22 : 0.4} palette={cart?.phase === "ready" ? "success" : "warm"} />
      </div>

      {stage === "ask" && (
        <section className="mx-auto mt-8 flex w-full max-w-3xl flex-col">
          <p className="label animate-rise text-center">Hi {firstName}</p>
          <h1 className="display animate-rise mt-4 text-center text-[clamp(2.3rem,6vw,4rem)] [animation-delay:60ms]">
            What do you want to eat today?
          </h1>
          {/* z-20: the autocomplete list must sit above the animated siblings below it */}
          <div className="animate-rise relative z-20 mt-12 w-full [animation-delay:120ms]">
            <DishInput value={query} onChange={setQuery} onSubmit={askDish} catalog={catalog} autoFocus />
          </div>
          <p className="animate-rise mt-3 font-mono text-[11.5px] text-paper/35 [animation-delay:180ms]">
            Type anything, or pick from the menu below.
          </p>
          <div className="animate-rise mt-14 [animation-delay:240ms]">
            <DishMenu catalog={catalog} onPick={askDish} />
          </div>
        </section>
      )}

      {stage === "styles" && (
        <StylePicker
          query={query}
          variants={variants}
          error={variantsError}
          onPick={chooseStyle}
          onRetry={() => askDish(query)}
          onEdit={() => goTo("ask")}
          onPickDish={askDish}
        />
      )}

      {stage === "ingredients" && variants && choice && (
        <IngredientList
          dish={variants.dish}
          variant={choice}
          list={list}
          error={listError}
          items={items}
          excluded={excluded}
          servings={servings}
          zepto={zepto}
          onToggle={(id) =>
            setExcluded((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
          onServings={setServings}
          onRetry={() => chooseStyle(choice)}
          onBuild={() => buildCart()}
          onSave={saveToPlan}
          saved={savedToPlan}
        />
      )}

      {stage === "cart" && cart && choice && (
        <CartView
          cart={cart}
          variantTitle={choice.title}
          styleLabel={styleById(choice.style).label}
          itemCount={chosen.length}
          edits={cartEdits}
          onRemove={removeLine}
          onQty={changeQty}
          onAddBack={addBackLine}
          onPlaceOrder={() => {
            setPlaceError(null);
            setConfirmOpen(true);
          }}
          onRetry={() => buildCart()}
          onBack={() => goTo("ingredients")}
          onStartOver={startOver}
        />
      )}

      <Dialog
        open={connectOpen}
        onClose={() => {
          buildAfterConnect.current = false;
          setConnectOpen(false);
        }}
        title="Connect your store"
      >
        <ZeptoConnect
          allowSimulated={simulatedCart}
          onConnected={(state) => {
            setZepto(state);
            setConnectOpen(false);
            if (buildAfterConnect.current) {
              buildAfterConnect.current = false;
              void buildCart(true);
            }
          }}
        />
      </Dialog>

      {cart?.phase === "ready" &&
        (() => {
          const eff = effectiveCart(cart.status, cartEdits);
          return (
            <OrderConfirm
              open={confirmOpen}
              summary={{ packs: eff.packs, products: eff.lines.length, totalInr: eff.totalInr, etaMinutes: cart.status.etaMinutes }}
              firstName={firstName}
              busy={placing}
              error={placeError}
              onClose={() => !placing && setConfirmOpen(false)}
              onConfirm={placeOrder}
            />
          );
        })()}

      <ProfileDialog open={profileOpen} onDone={profileDone} />
    </main>
  );
}
