import React, { useState, useEffect } from "react";
import { ClientAPI, WebHooks } from "contentful-management";
import {
  Paragraph,
  FormControl,
  Checkbox,
  Button,
  Notification,
} from "@contentful/f36-components";
import { SidebarExtensionSDK } from "@contentful/app-sdk";

interface SidebarProps {
  sdk: SidebarExtensionSDK;
  cma: ClientAPI;
}

const Sidebar = ({ sdk, cma }: SidebarProps) => {
  const [webhooks, setWebhooks] = useState<WebHooks[]>([]);
  const [selectedWebhooks, setSelectedWebhooks] = useState<WebHooks[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    webhook: WebHooks
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
    (async () => {
      cma
        .getSpace(sdk.ids.space)
        .then((space) => space.getWebhooks())
        .then((response) => {
          setWebhooks(response.items);
        })
        .catch(console.error);
    })();
  }, [cma, sdk]);

  return (
    <>
      <FormControl as="fieldset">
        <Paragraph>Select the webhooks to trigger builds:</Paragraph>
        <Checkbox.Group>
          {webhooks.map((webhook) => (
            <Checkbox
              key={webhook.sys.id}
              id={webhook.sys.id}
              isDisabled={!webhook.active}
              onChange={(e) => handleChange(e, webhook)}
            >
              {webhook.name}
            </Checkbox>
          ))}
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
