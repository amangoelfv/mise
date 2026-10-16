import { getIngredients } from "@/lib/gemini";
import { DIETS, STYLES, fail, num, oneOf, readJson, requireUser, str, strList } from "@/lib/http";

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await readJson(req);
  const variant = (body.variant ?? {}) as Record<string, unknown>;
  const dish = str(body.dish, "", 60);
  if (!dish) return fail("Missing dish.");

  try {
    return Response.json(
      await getIngredients({
        dish,
        cuisine: str(body.cuisine, "", 60),
        style: oneOf(body.style, STYLES, "basic"),
        variant: {
          title: str(variant.title, dish, 48),
          tagline: str(variant.tagline, "", 120),
          highlights: strList(variant.highlights, 3, 32),
        },
        servings: Math.round(num(body.servings, 2, 1, 12)),
        diet: oneOf(body.diet, DIETS, "any"),
        avoid: strList(body.avoid, 10, 40),
      }),
    );
  } catch (error) {
    console.error("[dish/ingredients]", error);
    return fail("Gemini couldn't draft the list. Try again?", 502);
  }
}
