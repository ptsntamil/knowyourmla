import React from "react";
import JsonLd from "./JsonLd";
import { generateItemListSchema } from "@/lib/seo/jsonld";

interface ItemListSchemaProps {
  items: { name: string; url: string; position?: number }[];
}

export default function ItemListSchema({ items }: ItemListSchemaProps) {
  const schema = generateItemListSchema(items);
  return <JsonLd data={schema} />;
}
