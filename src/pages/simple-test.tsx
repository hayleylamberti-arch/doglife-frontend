export default function SimpleTest() {
  return (
    <div style={{padding: '20px', background: 'white', color: 'black'}}>
      <h1>Simple Test Page Works!</h1>
      <p>URL: {window.location.href}</p>
      <p>Search: {window.location.search}</p>
      <p>If you can see this, routing is working.</p>
    </div>
  );
}