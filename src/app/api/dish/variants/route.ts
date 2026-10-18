import { getVariants } from "@/lib/gemini";
import { BUDGETS, DIETS, fail, num, oneOf, readJson, requireUser, str, strList } from "@/lib/http";

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await readJson(req);
  const query = str(body.query, "", 80);
  if (query.length < 2) return fail("Tell us a dish, like “white sauce pasta”.");

  try {
    return Response.json(
      await getVariants({
        query,
        diet: oneOf(body.diet, DIETS, "any"),
        avoid: strList(body.avoid, 10, 40),
        budget: oneOf(body.budget, BUDGETS, "best_rated"),
        // Derived on the device; the raw weight and age band never leave it.
        proteinTargetG: body.proteinTargetG == null ? null : Math.round(num(body.proteinTargetG, 0, 20, 300)) || null,
      }),
    );
  } catch (error) {
    console.error("[dish/variants]", error);
    return fail("Gemini is having a moment. Try again?", 502);
  }
}
