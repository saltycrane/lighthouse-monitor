import { cn } from "@/lib/style";
import { forwardRef } from "react";

const Heading = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }
>(({ className, level = 1, ...props }, ref) => {
  const Component = `h${level}` as const;
  const styles = {
    1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
    2: "scroll-m-20 text-3xl font-semibold tracking-tight",
    3: "scroll-m-20 text-2xl font-semibold tracking-tight",
    4: "scroll-m-20 text-xl font-semibold tracking-tight",
    5: "scroll-m-20 text-lg font-semibold tracking-tight",
    6: "scroll-m-20 text-base font-semibold tracking-tight",
  };

  return (
    <Component ref={ref} className={cn(styles[level], className)} {...props} />
  );
});
Heading.displayName = "Heading";

export { Heading };
