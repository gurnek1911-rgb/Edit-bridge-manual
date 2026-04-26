import Link from "next/link";

export default function Client() {
  return (
    <div style={{
      minHeight:"100vh",
      background:"#0f172a",
      color:"white",
      padding:"40px"
    }}>
      <h1>Client Dashboard</h1>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
        gap:"20px",
        marginTop:"30px"
      }}>

        <Link href="/" style={card}>
          Browse Editors
        </Link>

        <Link href="/payment" style={card}>
          Unlock Chat
        </Link>

        <Link href="/my-orders" style={card}>
          My Orders
        </Link>

      </div>
    </div>
  );
}

const card = {
  padding:"30px",
  background:"#1e293b",
  borderRadius:"20px",
  textDecoration:"none",
  color:"white",
  fontSize:"20px"
};