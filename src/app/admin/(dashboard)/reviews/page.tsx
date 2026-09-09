import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BadgeCheck, Check, MessageSquareText, X } from "lucide-react";
import { Stars } from "@/components/ui/stars";
import { approveReview, rejectReview } from "./actions";

export const metadata = { title: "Reseñas" };

const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const statusLabels: Record<ReviewStatus, string> = {
  pending: "Pendientes",
  approved: "Publicadas",
  rejected: "Rechazadas",
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const selectedStatus: ReviewStatus = REVIEW_STATUSES.includes(
    params.status as ReviewStatus,
  )
    ? (params.status as ReviewStatus)
    : "pending";
  const supabase = await createServerSupabaseClient();
  const [{ data: reviews, error }, ...countResults] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, rating, title, content, status, verified_purchase, created_at, profiles:user_id(email), products:product_id(name, slug)",
      )
      .eq("status", selectedStatus)
      .order("created_at", { ascending: selectedStatus === "pending" })
      .limit(100),
    ...REVIEW_STATUSES.map((status) =>
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", status),
    ),
  ]);

  const counts = Object.fromEntries(
    REVIEW_STATUSES.map((status, index) => [
      status,
      countResults[index]?.count ?? 0,
    ]),
  ) as Record<ReviewStatus, number>;

  return (
    <div>
      <header className="rounded-md border border-line bg-white-warm p-6 shadow-subtle sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="eyebrow text-gold-deep">Comunidad</p>
            <h1 className="mt-2 font-display text-h2">Reseñas</h1>
            <p className="mt-2 text-sm text-body">
              Modera primero las más antiguas. Solo las aprobadas aparecen en la
              tienda.
            </p>
          </div>
          <div className="flex min-w-32 items-center gap-3 rounded-sm border border-champagne/40 bg-gold/35 px-4 py-3">
            <MessageSquareText
              className="size-5 text-gold-deep"
              aria-hidden="true"
            />
            <div>
              <p className="tabular text-2xl font-semibold leading-none text-ink">
                {counts.pending}
              </p>
              <p className="mt-1 text-caption uppercase tracking-[0.08em] text-body">
                Pendientes
              </p>
            </div>
          </div>
        </div>
      </header>

      <nav
        className="mt-6 flex gap-2 overflow-x-auto rounded-sm border border-line bg-white-warm p-2 shadow-subtle"
        aria-label="Estado de las reseñas"
      >
        {REVIEW_STATUSES.map((status) => {
          const active = status === selectedStatus;
          return (
            <Link
              key={status}
              href={
                status === "pending"
                  ? "/admin/reviews"
                  : `/admin/reviews?status=${status}`
              }
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xs px-4 text-sm font-semibold transition-colors ${
                active
                  ? "bg-champagne text-ink shadow-subtle"
                  : "text-body hover:bg-gold/35 hover:text-ink"
              }`}
            >
              {statusLabels[status]}
              <span
                className={`rounded-full px-2 py-0.5 text-xs tabular ${
                  active ? "bg-ink/10" : "bg-blush"
                }`}
              >
                {counts[status]}
              </span>
            </Link>
          );
        })}
      </nav>

      {error ? (
        <p className="mt-8 text-sm text-danger">
          No se pudieron cargar las reseñas: {error.message}
        </p>
      ) : reviews && reviews.length > 0 ? (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex flex-col rounded-md border border-line bg-white-warm p-5 shadow-subtle sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {review.products?.name ??
                      review.products?.slug ??
                      "Producto"}
                  </p>
                  <p className="text-xs text-muted">
                    {review.profiles?.email ?? "Cliente sin correo"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Intl.DateTimeFormat("es-DO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(review.created_at))}
                  </p>
                  {review.verified_purchase ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                      <BadgeCheck className="size-4" aria-hidden="true" />
                      Compra verificada
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={review.rating} />
                  <span className="sr-only">{review.rating} de 5</span>
                </div>
              </div>

              {review.title ? (
                <p className="mt-3 font-medium text-ink">{review.title}</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-body">
                {review.content}
              </p>

              <div className="mt-auto flex gap-3 pt-6">
                {selectedStatus !== "approved" ? (
                  <form action={approveReview}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xs bg-champagne px-5 text-sm font-semibold text-ink transition-colors hover:bg-gold"
                    >
                      <Check className="size-4" aria-hidden="true" />
                      {selectedStatus === "rejected" ? "Publicar" : "Aprobar"}
                    </button>
                  </form>
                ) : null}
                {selectedStatus !== "rejected" ? (
                  <form action={rejectReview}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xs border border-danger/35 px-5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                    >
                      <X className="size-4" aria-hidden="true" />
                      {selectedStatus === "approved" ? "Retirar" : "Rechazar"}
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-md border border-line bg-white-warm p-10 text-center shadow-subtle">
          <MessageSquareText
            className="mx-auto size-8 text-champagne"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="mt-4 font-semibold text-ink">
            No hay reseñas {statusLabels[selectedStatus].toLowerCase()}
          </p>
          <p className="mt-1 text-sm text-body">
            {selectedStatus === "pending"
              ? "La cola de moderación está al día."
              : "Cuando cambies una reseña a este estado, aparecerá aquí."}
          </p>
        </div>
      )}
    </div>
  );
}
