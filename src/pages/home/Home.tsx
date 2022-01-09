import { Row, Col, Card } from "react-bootstrap";
import { useContractProvider } from "../../providers/ContractProvider";

interface CardDataInterface {
  title: string;
  description: string;
}

export default function Home() {
  const {
    state: { stakers, numberOfTokens, numberOfStakers, tokens, TVL },
  } = useContractProvider();

  const HomeCardsData: CardDataInterface[] = [
    {
      title: "Total Value Locked",
      description: "$" + TVL.toString(),
    },
    {
      title: "Number of supported tokens",
      description: numberOfTokens.toString(),
    },
    {
      title: "Number of stakers",
      description: numberOfStakers.toString(),
    },
  ];

  return (
    <>
      <h1>Earn ETH for staking tokens!</h1>
      <hr />
      <Row xs={1} md={2} lg={3} className="g-4">
        {HomeCardsData.map(({ title, description }) => (
          <Col key={title}>
            <Card border="warning">
              <Card.Header>{title}</Card.Header>
              <Card.Body>
                <Card.Title>{description}</Card.Title>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
