import { CartApiError, getCart } from "@/lib/cart-api";
import { fail, requireUser } from "@/lib/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/cart/[id]">) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  try {
    return Response.json({ status: await getCart(id) });
  } catch (error) {
    if (error instanceof CartApiError) return fail(error.message, error.status);
    return fail("Couldn't check on your cart.", 502);
  }
}
