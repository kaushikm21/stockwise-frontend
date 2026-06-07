import yfinance as yf
import time

t = yf.Ticker("AAPL")
_ = t.history(period="3mo")  # simulate existing call

start = time.time()
news = t.news
elapsed = time.time() - start
print(f"News fetch took: {elapsed:.3f}s")
print(f"Headlines: {len(news)}")
