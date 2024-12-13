import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, List, Card } from "antd";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");
const marketplaceAddr =
  "0xc80d98f378efe25cd34d2f561f5b4866ddb31e602db2ab3bc0c9ff6be91cd93c";

function Auction() {
  const { signAndSubmitTransaction } = useWallet();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [auctions, setAuctions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Function to retrieve active auctions
  const fetchActiveAuctions = async () => {
    try {
      setLoading(true);
      const response = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_active_auctions`,
        type_arguments: [],
        arguments: [marketplaceAddr],
      });
  
      // Transform response to ensure it's a number array
      const auctionIds = response.map((item) => {
        if (typeof item === "number") {
          return item; // Keep valid numbers
        }
        throw new Error("Invalid auction ID type received"); // Handle unexpected types
      });
  
      setAuctions(auctionIds); // Set the numeric IDs
      setLoading(false);
    } catch (error) {
      console.error("Error fetching active auctions:", error);
      message.error("Failed to fetch auctions.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAuctions();
  }, []);

  // Function to open the modal
  const handleOpenModal = () => setIsModalVisible(true);

  // Function to list NFT for auction
  const handleListAuction = async (values: {
    nft_id: number;
    start_price: number;
    reserve_price: number;
    duration: number;
  }) => {
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::list_nft_for_auction`,
        type_arguments: [],
        arguments: [marketplaceAddr,
          values.nft_id,
          values.start_price,
          values.reserve_price,
          values.duration,
        ],
      };
      console.log("Payload:", entryFunctionPayload);

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction({ payload: entryFunctionPayload });
      await client.waitForTransaction(txnResponse.hash);

      message.success("NFT listed for auction successfully!");
      setIsModalVisible(false);
      fetchActiveAuctions();
    } catch (error) {
      console.error("Error listing NFT for auction:", error);
      message.error("Failed to list NFT.");
    }
  };

  // Function to bid on an auction
  const handleBid = async (auctionId: number, payment: number) => {
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::bid_on_auction`,
        type_arguments: [],
        arguments: [auctionId, payment],
      };
      console.log("Payload:", entryFunctionPayload);

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction({ payload: entryFunctionPayload });
      await client.waitForTransaction(txnResponse.hash);

      message.success("Bid placed successfully!");
      fetchActiveAuctions();
    } catch (error) {
      console.error("Error placing bid:", error);
      message.error("Failed to place bid.");
    }
  };

  // Function to finalize an auction
  const handleFinalizeAuction = async (auctionId: number) => {
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::finalize_auction`,
        type_arguments: [],
        arguments: [auctionId],
      };
      console.log("Payload:", entryFunctionPayload);

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction({ payload: entryFunctionPayload });
      await client.waitForTransaction(txnResponse.hash);

      message.success("Auction finalized successfully!");
      fetchActiveAuctions();
    } catch (error) {
      console.error("Error finalizing auction:", error);
      message.error("Failed to finalize auction.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Button type="primary" onClick={handleOpenModal}>
        List NFT for Auction
      </Button>
      <Modal
        title="List NFT for Auction"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleListAuction} layout="vertical">
          <Form.Item
            label="NFT ID"
            name="nft_id"
            rules={[{ required: true, message: "Please input the NFT ID!" }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Start Price"
            name="start_price"
            rules={[{ required: true, message: "Please input the start price!" }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Reserve Price"
            name="reserve_price"
            rules={[
              { required: true, message: "Please input the reserve price!" },
            ]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Duration (seconds)"
            name="duration"
            rules={[{ required: true, message: "Please input the duration!" }]}
          >
            <Input type="number" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            List NFT
          </Button>
        </Form>
      </Modal>
      <h2>Active Auctions</h2>
      <List
        loading={loading}
        grid={{ gutter: 16, column: 3 }}
        dataSource={auctions}
        renderItem={(auctionId) => (
          <List.Item>
            <Card
              title={`Auction ID: ${auctionId}`}
              actions={[
                <Button
                  onClick={() =>
                    handleBid(auctionId, 100) // Replace 100 with your bid logic
                  }
                >
                  Place Bid
                </Button>,
                <Button onClick={() => handleFinalizeAuction(auctionId)}>
                  Finalize Auction
                </Button>,
              ]}
            >
              Details of auction {auctionId}
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}

export default Auction;
