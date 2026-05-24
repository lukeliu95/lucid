"use client";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function TwoTierTabs({ quick, deep }: { quick: string; deep: string }) {
  const t = useTranslations();
  return (
    <div className="max-w-content">
      <div className="mb-4 font-sans text-xs uppercase tracking-widest text-text-muted">
        {t("a11y.tabs_label")} · {t("video.tier.quick")} / {t("video.tier.deep")}
      </div>
      <Tabs defaultValue="quick" className="">
        <TabsList className="mb-6">
          <TabsTrigger value="quick">{t("video.tier.quick")}</TabsTrigger>
          <TabsTrigger value="deep">{t("video.tier.deep")}</TabsTrigger>
        </TabsList>
        <TabsContent value="quick">
          {quick.split("\n\n").map((para, i) => (
            <p key={i} className="mb-4">
              {para}
            </p>
          ))}
        </TabsContent>
        <TabsContent value="deep">
          {deep.split("\n\n").map((para, i) => (
            <p key={i} className="mb-4">
              {para}
            </p>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
