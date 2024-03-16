"use-client";

import { run } from "@mdx-js/mdx";
import { Fragment, useEffect, useState } from "react";
import * as runtime from "react/jsx-runtime";
import { mdxComponents } from "../utils/mdx-components";

type MdxModule = Awaited<ReturnType<typeof run>>;

export function MdxContent({ code }: { code: string }) {
  const [mdxModule, setMdxModule] = useState<MdxModule>();
  const Content = mdxModule?.default;

  useEffect(
    function () {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async function () {
        setMdxModule(
          await run(code, { ...runtime, baseUrl: import.meta.url, Fragment }),
        );
      })();
    },
    [code],
  );

  if (!Content) {
    return null;
  }

  return <Content components={{ ...mdxComponents }} />;
}
