export default function UnreadBadge({ count }) {
  if (!count) return null;
  return <span style={{background:"#e01e5a",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:11,fontWeight:700}}>{count > 99 ? "99+" : count}</span>;
}
