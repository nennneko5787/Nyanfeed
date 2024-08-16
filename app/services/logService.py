import aiohttp
from discord import Webhook, Embed

from .. import Env


class LogService:
    @classmethod
    async def webhook(cls, *, eventName: str, eventBody: str, ipAddress: str):
        async with aiohttp.ClientSession() as session:
            webhook = Webhook.from_url(Env.get("discord_webhook"), session=session)
            embed = Embed(
                title=f"イベント {eventName}",
                description=f"""
                    IPアドレス: **{ipAddress}**
                    {eventBody}
                """,
            )
            await webhook.send(embed=embed, username="Nyanfeed Logger")
