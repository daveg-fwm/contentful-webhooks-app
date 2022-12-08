import React, { useState, useEffect } from "react";
import { PlainClientAPI, WebhookProps } from "contentful-management";
import {
  Paragraph,
  FormControl,
  Checkbox,
  Button,
  Notification,
  TextLink,
  Flex,
} from "@contentful/f36-components";
import { SidebarExtensionSDK } from "@contentful/app-sdk";

interface SidebarProps {
  sdk: SidebarExtensionSDK;
  cma: PlainClientAPI;
}

const Sidebar = ({ sdk, cma }: SidebarProps) => {
  const [webhooks, setWebhooks] = useState<WebhookProps[]>([]);
  const [selectedWebhooks, setSelectedWebhooks] = useState<WebhookProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    webhook: WebhookProps
  ) => {
    const isChecked = e.target.checked;

    if (isChecked) {
      setSelectedWebhooks([...selectedWebhooks, webhook]);
    } else {
      const indexToRemove = selectedWebhooks.findIndex(
        (selectedWebhook) => selectedWebhook.sys.id === webhook.sys.id
      );
      selectedWebhooks.splice(indexToRemove, 1);
      setSelectedWebhooks([...selectedWebhooks]);
    }
  };

  const handleTriggerBuild = () => {
    setIsLoading(true);

    return Promise.all(
      selectedWebhooks.map(({ url }) => {
        return fetch(url, { method: "POST" }).then((resp) => {
          resp.json();

          Notification.success("The selected websites are building!", {
            duration: 2500, // 2.5s
          });

          setSelectedWebhooks([]);
          setIsLoading(false);
        });
      })
    );
  };

  // Make sure the height of the iframe is adjusted to the height of this
  // component dynamically.
  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  useEffect(() => {
    (() => {
      cma.webhook
        .getMany({ spaceId: sdk.ids.space, query: { limit: 100 } })
        .then((response) => {
          const sortedWebhooks = response.items.sort((webhookA, webhookB) => {
            const regexPattern = /Production|Staging|Preview/i;
            const webhookAEnv = webhookA.name.match(regexPattern)?.[0];
            const webhookBEnv = webhookB.name.match(regexPattern)?.[0];

            if (webhookAEnv && webhookBEnv) {
              return webhookAEnv.localeCompare(webhookBEnv);
            }

            return 0;
          });

          setWebhooks(sortedWebhooks);
        })
        .catch(console.error);
    })();
  }, [cma, sdk]);

  return (
    <>
      <FormControl as="fieldset">
        <Paragraph>Select the webhooks to trigger builds:</Paragraph>
        <Checkbox.Group>
          {webhooks.map((webhook) => {
            const previewUrl = webhook.transformation?.body;

            return (
              <Flex key={webhook.sys.id} gap="spacingS">
                <Checkbox
                  id={webhook.sys.id}
                  isDisabled={!webhook.active}
                  onChange={(e) => handleChange(e, webhook)}
                >
                  {webhook.name}
                </Checkbox>

                {previewUrl ? (
                  <TextLink
                    href={previewUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open site
                  </TextLink>
                ) : null}
              </Flex>
            );
          })}
        </Checkbox.Group>
      </FormControl>
      <Button
        variant="positive"
        isFullWidth
        isDisabled={!selectedWebhooks.length || isLoading}
        onClick={handleTriggerBuild}
        isLoading={isLoading}
      >
        Build: {selectedWebhooks.length} selected
      </Button>
    </>
  );
};

export default Sidebar;
