import { SomenteAnonimo } from "@/components/auth";

/** Login e cadastros: so para quem ainda nao entrou. */
export default function LayoutPublico({ children }: LayoutProps<"/">) {
  return (
    <SomenteAnonimo>
      <div className="mx-auto w-full max-w-xl">{children}</div>
    </SomenteAnonimo>
  );
}
