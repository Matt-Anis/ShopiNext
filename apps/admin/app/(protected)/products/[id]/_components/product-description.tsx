interface ProductDescriptionProps {
  description: string | null
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  return (
    <section>
      <h2 className="text-xs font-medium tracking-wide text-foreground uppercase">
        Description
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description || "No description provided."}
      </p>
    </section>
  )
}
