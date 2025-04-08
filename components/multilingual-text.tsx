interface MultilingualTextProps {
  primary: string
  secondary: string
  className?: string
}

export function MultilingualText({ primary, secondary, className = "" }: MultilingualTextProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-muted-foreground">{primary}</p>
      <p className="text-muted-foreground text-sm italic">{secondary}</p>
    </div>
  )
}
