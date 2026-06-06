export default function Presence({ status }) {
  const colors = { online:"#2eb67d", away:"#ecb22e", offline:"#616061" };
  return <span style={{width:8,height:8,borderRadius:"50%",background:colors[status]||colors.offline,display:"inline-block"}} />;
}
