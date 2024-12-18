import React, { useState, useEffect } from "react";
import { List, Card, Layout, Row, Col, Button } from "antd";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";

type DutchAuction = {
  nft_id: string;
  seller: string;
  start_price: string;
  reserve_price: string;
  duration: string;
  start_time: string;
  is_active: boolean;
  highest_bid: string;
  highest_bidder: string;
};

const aptosConfig = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(aptosConfig);

const AuctionPage = () => {
  const { account } = useWallet();
  const [accountHasAuction, setAccountHasAuction] = useState<boolean>(false);
  const [auctions, setAuctions] = useState<DutchAuction[]>([]);

  const fetchAuction = async () => {
    if (!account) return;

    console.log("Fetching auction for account:", account.address);

    const moduleAddress =
      "0xc80d98f378efe25cd34d2f561f5b4866ddb31e602db2ab3bc0c9ff6be91cd93c";

    try {
      const AuctionHouseResource = await aptos.getAccountResource({
        accountAddress: account?.address,
        resourceType: `${moduleAddress}::NFTMarketplace::AuctionHouse`,
      });

      console.log("Auction resource fetched successfully:", AuctionHouseResource);

      const fetchedAuctions: DutchAuction[] =
        AuctionHouseResource?.data?.auctions || [];
      if (Array.isArray(fetchedAuctions)) {
        setAuctions(fetchedAuctions);
        setAccountHasAuction(fetchedAuctions.length > 0);
      } else {
        setAuctions([]);
        setAccountHasAuction(false);
      }
    } catch (e: any) {
      console.error("Error fetching auction resource:", e);
      setAuctions([]);
      setAccountHasAuction(false);
    }
  };

  useEffect(() => {
    fetchAuction();
  }, [account?.address]);

  return (
    <div>
      <Layout>
        <Row align="middle">
          <Col span={10} offset={2}>
            <h1>Auction List</h1>
          </Col>
          <Col span={12} style={{ textAlign: "right", paddingRight: "200px" }}>
            <WalletSelector />
          </Col>
        </Row>
      </Layout>

      {accountHasAuction && auctions.length > 0 ? (
        <div style={{ marginTop: "2rem", padding: "0 20px" }}>
          <h3>Available Auctions:</h3>
          <List
            grid={{ gutter: 16, column: 4 }}
            dataSource={auctions}
            renderItem={(auction) => (
              <List.Item>
                <Card title={`NFT ID: ${auction.nft_id}`}>
                  <p>Seller: {auction.seller}</p>
                  <p>Start Price: {auction.start_price}</p>
                  <p>Reserve Price: {auction.reserve_price}</p>
                  <p>Highest Bid: {auction.highest_bid}</p>
                  <p>Highest Bidder: {auction.highest_bidder}</p>
                  <p>Duration: {auction.duration}</p>
                  <p>
                    {auction.is_active
                      ? "Status: Active"
                      : "Status: Inactive"}
                  </p>
                </Card>
              </List.Item>
            )}
          />
        </div>
      ) : (
        <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
          <Col span={8} offset={8}>
            <Button
              block
              type="primary"
              style={{ height: "40px", backgroundColor: "#3f67ff" }}
              onClick={() => console.log("Add new Auction button clicked.")}
            >
              Add new Auction
            </Button>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default AuctionPage;
