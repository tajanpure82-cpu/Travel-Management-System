type DashboardHeaderProps = {
  title: string
  subtitle: string
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
    </div>
  )
}
