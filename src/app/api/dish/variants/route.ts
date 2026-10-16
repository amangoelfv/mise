import { getVariants } from "@/lib/gemini";
import { DIETS, fail, oneOf, readJson, requireUser, str, strList } from "@/lib/http";

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await readJson(req);
  const query = str(body.query, "", 80);
  if (query.length < 2) return fail("Tell us a dish, like “white sauce pasta”.");

  try {
    return Response.json(
      await getVariants({ query, diet: oneOf(body.diet, DIETS, "any"), avoid: strList(body.avoid, 10, 40) }),
    );
  } catch (error) {
    console.error("[dish/variants]", error);
    return fail("Gemini is having a moment. Try again?", 502);
  }
}
